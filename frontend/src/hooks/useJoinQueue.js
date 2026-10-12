import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errors';
import { formatToken } from '../utils/format';

/**
 * Join flow: button loading -> backend call -> success state -> redirect to the live queue.
 * Nothing is shown as joined until the backend has confirmed it.
 * A 409 means the user already has an active entry there; we confirm that with GET my-entry
 * instead of matching on the error message text.
 */
export function useJoinQueue() {
  const navigate = useNavigate();
  const toast = useToast();
  const [busyId, setBusyId] = useState(null);
  const [doneId, setDoneId] = useState(null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const goTo = useCallback(
    (queueId) => {
      timer.current = setTimeout(() => navigate(`/app/queues/${queueId}`), 450);
    },
    [navigate],
  );

  const join = useCallback(
    async (queue) => {
      if (busyId) return;
      setBusyId(queue._id);
      try {
        const res = await api.post(`/queues/${queue._id}/join`);
        setBusyId(null);
        setDoneId(queue._id);
        toast.success(`Your token is ${formatToken(res.data.data.displayToken)}`, { title: `Joined ${queue.name}` });
        goTo(queue._id);
      } catch (err) {
        setBusyId(null);
        if (err.response?.status === 409) {
          try {
            await api.get(`/queues/${queue._id}/my-entry`);
            toast.info("You're already in this queue.");
            setDoneId(queue._id);
            goTo(queue._id);
            return;
          } catch {
            /* not an active-entry conflict: fall through to the real message */
          }
        }
        toast.error(getErrorMessage(err, 'Could not join this queue.'));
      }
    },
    [busyId, goTo, toast],
  );

  return { join, busyId, doneId };
}
