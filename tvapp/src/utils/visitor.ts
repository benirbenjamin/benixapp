import { v4 as uuidv4 } from 'uuid';

export function initializeVisitorTracking(): { visitorId: string; sessionId: string; isNewVisitor: boolean } {
  let visitorId = localStorage.getItem('rba_visitor_id');
  let isNewVisitor = false;

  if (!visitorId) {
    visitorId = uuidv4();
    localStorage.setItem('rba_visitor_id', visitorId);
    isNewVisitor = true;
  }

  let sessionId = sessionStorage.getItem('rba_session_id');
  if (!sessionId) {
    sessionId = uuidv4();
    sessionStorage.setItem('rba_session_id', sessionId);
  }

  return { visitorId, sessionId, isNewVisitor };
}
