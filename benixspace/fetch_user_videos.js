import fs from 'fs';

const rawUrls = [
  "https://youtu.be/w35ybfqDQUo",
  "https://youtu.be/fw_5cHYRSPU",
  "https://youtu.be/WJjPXyOVElY",
  "https://youtu.be/Ef_q7XDyKU0",
  "https://youtu.be/iv8f2Jj0BvY",
  "https://youtu.be/K0HhSMdT-Q8",
  "https://youtu.be/zDXAICBgu8o",
  "https://youtu.be/fMqjcbZA-S4",
  "https://youtu.be/1ikJhnYH_M4",
  "https://youtu.be/X1_guD23PGw",
  "https://youtu.be/CdWO2HIYneg",
  "https://youtu.be/hXZdi2Wa-Fs",
  "https://youtu.be/8tB9MNXFfEU",
  "https://youtu.be/ogQ17IyKqXk",
  "https://youtu.be/k2C6-XQBQuM",
  "https://youtu.be/lA5NCh4qfW8",
  "https://youtu.be/o8J3U3wLHMQ",
  "https://youtu.be/Dc3CPuU_N2Q",
  "https://youtu.be/6b3IolqKUic",
  "https://youtu.be/nTmIuZzW17U",
  "https://youtu.be/sx-4vtQq1oc",
  "https://youtu.be/uyCY6h0gmPU",
  "https://youtu.be/Er_rmkrvqsA",
  "https://youtu.be/fMYFpzs0i6I",
  "https://youtu.be/fTIT81UiIYM",
  "https://youtu.be/PM0oneLeITc",
  "https://youtu.be/YSFV38H2ChM",
  "https://youtu.be/NDcaBWhAacg",
  "https://youtu.be/wx_YTu8g2wo",
  "https://youtu.be/AwJOhHw_7-Y",
  "https://youtu.be/tmuUYf7W2gM",
  "https://youtu.be/dliQCFd7Q4U",
  "https://youtu.be/1RXN4lJaeMk",
  "https://youtu.be/-PYUWr6u1Ac",
  "https://youtu.be/e1Cmn9-niQo",
  "https://youtu.be/_aMCCgSRVQ0",
  "https://youtu.be/PN75A29mSeM",
  "https://youtu.be/Exnj5mNd_NA",
  "https://youtu.be/3Zk0HtPzs7c",
  "https://youtu.be/vR3Vjp2EEKQ",
  "https://youtu.be/qS36RUHdNG0",
  "https://youtu.be/xUuoMcs9bWE",
  "https://youtu.be/pSNRvU9NwSk",
  "https://youtu.be/hPAeYPhQBG0",
  "https://youtu.be/tHLj4qj5oYs",
  "https://youtu.be/B0xTrgyZGeM",
  "https://youtu.be/8bRiK55CZVQ",
  "https://youtu.be/H4gfzkCYlzc",
  "https://youtu.be/JI5yydnYW5M",
  "https://youtu.be/PpKE6lAHcZw",
  "https://youtu.be/AhLADxTyuaE",
  "https://youtu.be/09zH7A8wD8c",
  "https://youtu.be/JGAYH5xP6g0",
  "https://youtu.be/yf5pn1FhQEQ",
  "https://youtu.be/NlLejmEhhzk",
  "https://youtu.be/B_UbIPEvLdE",
  "https://youtu.be/FgpQpvP7EPQ",
  "https://youtu.be/WdQ3danARWQ",
  "https://youtu.be/UVi6KT_528w",
  "https://youtu.be/q3hbPR4I0_E",
  "https://youtu.be/7jkM9QFfJtk",
  "https://youtu.be/vPS4txvYVEw",
  "https://youtu.be/xDfqkT5oJx8",
  "https://youtu.be/7QkcMqknFJQ",
  "https://youtu.be/lN-Gr173gWc",
  "https://youtu.be/b2GJyomWfsk",
  "https://youtu.be/IybSI2oXrqE",
  "https://youtu.be/Ubm7kTRnvWs",
  "https://youtu.be/QAEtWnZvGl4",
  "https://youtu.be/zX7pAWs-zxU",
  "https://youtu.be/LfVedFEcUeA",
  "https://youtu.be/lF_Rmb9qrxU",
  "https://youtu.be/c6-wEcsVxZ0",
  "https://youtu.be/NqkiKnTwLbQ",
  "https://youtu.be/X1Lv-ikjC1M",
  "https://youtu.be/9TQjM26v_Bs",
  "https://youtu.be/3jpVoM1AIdE",
  "https://youtu.be/wprVeT6OKMI",
  "https://youtu.be/q78fLvbK8ro",
  "https://youtu.be/58I3s8qIKlE",
  "https://youtu.be/ehxo_goADU8",
  "https://youtu.be/xf8oPaTtJEY",
  "https://youtu.be/Q3zJRrIe89I",
  "https://youtu.be/4SLyCFtxaSQ",
  "https://youtu.be/52HgQaK3Q0A",
  "https://youtu.be/ROGFdcaN2xw",
  "https://youtu.be/BNHDKf_0ahs",
  "https://youtu.be/WZ6_Vt7wzyo",
  "https://youtu.be/gMcTdYhaxiQ",
  "https://youtu.be/EadxMSuxyF0",
  "https://youtu.be/kTtcFlXsx_Y",
  "https://youtu.be/vFEbZemStAo",
  "https://youtu.be/zcm88yaI6jg",
  "https://youtu.be/Aeu6NWo42Nc"
];

const videoIds = Array.from(new Set(rawUrls.map(u => u.trim().split('/').pop()).filter(Boolean)));
console.log(`Found ${videoIds.length} unique video IDs to fetch metadata for.`);

async function fetchMeta(id) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`, {
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data && data.title) {
        return {
          id: id,
          title: data.title,
          creator: data.author_name || 'Benix Space Channel',
          channelName: data.author_name || 'Benix Space Channel',
          channelAvatar: '/logo.png',
          thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
          duration: '10:00',
          views: 0,
          likes: 0,
          category: 'General',
          price: 0,
          embedUrl: `https://www.youtube.com/embed/${id}`,
          description: `Watch ${data.title} on Benix.Space.`
        };
      }
    }
  } catch (e) {}

  // Fallback if oembed fails or times out
  return {
    id: id,
    title: `Benix Video ${id}`,
    creator: 'Benix Space Channel',
    channelName: 'Benix Space Channel',
    channelAvatar: '/logo.png',
    thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    duration: '10:00',
    views: 0,
    likes: 0,
    category: 'General',
    price: 0,
    embedUrl: `https://www.youtube.com/embed/${id}`,
    description: `Official Benix.Space Video Broadcast.`
  };
}

async function main() {
  const results = [];
  const chunkSize = 5;
  for (let i = 0; i < videoIds.length; i += chunkSize) {
    const chunk = videoIds.slice(i, i + chunkSize);
    console.log(`Fetching chunk ${i / chunkSize + 1} of ${Math.ceil(videoIds.length / chunkSize)}...`);
    const chunkRes = await Promise.all(chunk.map(id => fetchMeta(id)));
    results.push(...chunkRes);
  }

  console.log(`Successfully prepared ${results.length} real videos.`);
  const outputPath = './src/client/config/realVideos.json';
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`Saved videos metadata to ${outputPath}`);
}

main().catch(console.error);
