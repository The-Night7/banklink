import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  type DocumentData,
  type QueryConstraint
} from "firebase/firestore";

import { firestore } from "../lib/firebase";

export const useLiveCollection = <T>(path: string | null, constraints: QueryConstraint[] = []) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!path) {
      setData([]);
      setLoading(false);
      return;
    }

    const reference = query(collection(firestore, path), ...constraints);
    const unsubscribe = onSnapshot(reference, (snapshot: any) => {
      setData(snapshot.docs.map((item: any) => item.data() as T));
      setLoading(false);
    });

    return unsubscribe;
  }, [constraints, path]);

  return { data, loading };
};

export const useLiveDocument = <T>(path: string | null) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!path) {
      setData(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(firestore, path), (snapshot: any) => {
      setData(snapshot.exists() ? (snapshot.data() as T) : null);
      setLoading(false);
    });

    return unsubscribe;
  }, [path]);

  return { data, loading };
};
