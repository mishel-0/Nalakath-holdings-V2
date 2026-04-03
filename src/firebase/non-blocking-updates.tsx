
'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  serverTimestamp,
  CollectionReference,
  DocumentReference,
  SetOptions,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** 
 * Internal helper to log system actions to the auditLogs collection.
 */
function logAudit(db: any, action: string, entity: string, entityId: string, details?: any) {
  const auth = getAuth();
  const userId = auth.currentUser?.uid || 'system';
  
  addDoc(collection(db, 'auditLogs'), {
    userId,
    action, // CREATE, UPDATE, DELETE
    entity,
    entityId,
    details: details ? JSON.stringify(details).substring(0, 500) : '',
    timestamp: serverTimestamp(),
  });
}

export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options: SetOptions) {
  setDoc(docRef, data, options)
    .then(() => {
      logAudit(docRef.firestore, 'UPDATE/SET', docRef.parent.id, docRef.id, data);
    })
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'write',
          requestResourceData: data,
        })
      )
    });
}

export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  const promise = addDoc(colRef, data)
    .then((docRef) => {
      logAudit(colRef.firestore, 'CREATE', colRef.id, docRef.id, data);
      return docRef;
    })
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: data,
        })
      )
    });
  return promise;
}

export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  updateDoc(docRef, data)
    .then(() => {
      logAudit(docRef.firestore, 'UPDATE', docRef.parent.id, docRef.id, data);
    })
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: data,
        })
      )
    });
}

export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  deleteDoc(docRef)
    .then(() => {
      logAudit(docRef.firestore, 'DELETE', docRef.parent.id, docRef.id);
    })
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        })
      )
    });
}
