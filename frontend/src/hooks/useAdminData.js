import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { getErrorMessage } from '../utils/errors';

/**
 * Admin catalogue: GET /departments (admin also sees inactive ones) and GET /queues (admin sees every status).
 * One serialized loader, stale-safe. Admin screens are low-motion and do not subscribe to sockets.
 */
export function useAdminData() {
  const [departments, setDepartments] = useState([]);
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const ticket = useRef(0);

  const load = useCallback(async () => {
    const mine = ++ticket.current;
    try {
      const [dRes, qRes] = await Promise.all([api.get('/departments'), api.get('/queues')]);
      if (mine !== ticket.current) return;
      setDepartments(dRes.data.data || []);
      setQueues(qRes.data.data || []);
      setError(null);
    } catch (err) {
      if (mine === ticket.current) setError(getErrorMessage(err, 'Could not load admin data.'));
    } finally {
      if (mine === ticket.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => {
      ticket.current += 1;
    };
  }, [load]);

  return { departments, queues, loading, error, reload: load };
}
