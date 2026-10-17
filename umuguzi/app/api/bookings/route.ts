import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required to book a service" }, { status: 401 });
    }

    const body = await req.json();
    const { serviceId, packageTitle, bookingDate, totalAmount, notes, paymentMethod, paymentReference } = body;

    if (!serviceId || !bookingDate || !totalAmount) {
      return NextResponse.json({ error: "Missing required booking details." }, { status: 400 });
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found." }, { status: 404 });
    }

    // Create the booking
    const booking = await prisma.serviceBooking.create({
      data: {
        serviceId,
        customerId: user.id,
        providerId: service.providerId,
        packageTitle: packageTitle || "Standard Package",
        bookingDate: new Date(bookingDate),
        totalAmount: Number(totalAmount),
        notes: notes || null,
        paymentMethod: paymentMethod || "MANUAL",
        paymentStatus: paymentMethod === "WALLET" ? "PAID" : "PENDING",
        paymentReference: paymentReference || null,
        status: "PENDING",
      },
    });

    // Notify Provider
    await prisma.notification.create({
      data: {
        userId: service.providerId,
        type: "BOOKING",
        title: "New Service Booking Received!",
        message: `${user.displayName} has requested a booking for "${service.title}" on ${new Date(bookingDate).toLocaleDateString()}.`,
        link: `/dashboard/orders`,
      },
    });

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    console.error("Booking error:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
