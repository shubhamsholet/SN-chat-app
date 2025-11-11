import { inject, Injectable } from '@angular/core';
import { Firestore, doc, setDoc, getDoc, docData, collection, addDoc, CollectionReference, DocumentData, query, where, getDocs, deleteDoc, updateDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { from, Observable } from 'rxjs';
import { LocalNotifications } from '@capacitor/local-notifications';
export interface User {
  id?: string;
  name: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private firestore = inject(Firestore);
  usersCollection: CollectionReference<DocumentData> = collection(this.firestore, 'users');

  async createUser(name: string, phoneNumber: number, password: string): Promise<string> {
    try {
      console.log('✅ usersCollection path:', this.usersCollection.path);
      console.log('📦 Creating user:', { name, phoneNumber, password });

      // Add a new document with an automatically generated ID
      const docRef = await addDoc(this.usersCollection, {
        name,
        password,
        phoneNumber,
        createdAt: new Date().toISOString()
      });

      console.log('🔥 User added successfully with ID:', docRef.id);
      this.showToast('User added successfully', 'success');
      return docRef.id;
    } catch (error) {
      console.log('❌ Error adding user:', error);
      this.showToast('Error adding user', 'error');
      throw error;
    }
  }

  async getUserByphoneNumber(phoneNumber: string): Promise<{ id: string; data: User } | null> {
    try {
      const q = query(this.usersCollection, where('phoneNumber', '==', phoneNumber));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.warn('⚠️ No user found for phoneNumber:', phoneNumber);
        return null;
      }

      // Assuming phoneNumber is unique → return first match
      const docSnap = querySnapshot.docs[0];
      const userData = docSnap.data() as User;

      console.log('✅ User found:', { id: docSnap.id, ...userData });
      // this.showToast('User fetched successfully', 'success');
      return { id: docSnap.id, data: userData };
    } catch (error) {
      console.error('❌ Error fetching user by phoneNumber:', error);
      // this.showToast('Error fetching user by phoneNumber', 'error');
      throw error;
    }
  }

  async updateUser(userId: string, data: Record<string, any>): Promise<void> {
    try {
      const userDocRef = doc(this.firestore, `users/${userId}`);

      // merge: true ensures existing fields remain untouched, and new ones are added
      await setDoc(userDocRef, data, { merge: true });

      console.log(`✅ User (${userId}) updated with:`, data);
      this.showToast('User updated successfully', 'success');
    } catch (error) {
      console.error('❌ Error updating user:', error);
      this.showToast('Error updating user', 'error');
      throw error;
    }
  }
  async deleteUserByphoneNumber(phoneNumber: number): Promise<boolean> {
    try {
      const q = query(this.usersCollection, where('phoneNumber', '==', phoneNumber));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.warn('⚠️ No user found for phoneNumber:', phoneNumber);
        return false;
      }

      const docSnap = querySnapshot.docs[0];
      const userDocRef = doc(this.firestore, `users/${docSnap.id}`);

      await deleteDoc(userDocRef);
      this.showToast('User deleted successfully', 'success');
      console.log(`🗑️ User with phoneNumber "${phoneNumber}" deleted successfully (ID: ${docSnap.id})`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting user by phoneNumber:', error);
      this.showToast('Error deleting user', 'error');
      throw error;

    }
  }


  async getAllUsers(): Promise<{ id: string; data: User }[]> {
    try {
      const querySnapshot = await getDocs(this.usersCollection);
      const users: { id: string; data: User }[] = [];

      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, data: doc.data() as User });
      });

      console.log('✅ All users fetched:', users);
      return users;
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      this.showToast('Error fetching users', 'error');
      throw error;
    }
  }

  async getUserById(uid: string): Promise<{ id: string; data: User } | null> {
    try {
      const userDocRef = doc(this.firestore, `users/${uid}`);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const userData = userSnap.data() as User;
        console.log('✅ User fetched:', { id: userSnap.id, data: userData });
        return { id: userSnap.id, data: userData };
      } else {
        console.warn('⚠️ No user found for UID:', uid);
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching user by UID:', error);
      this.showToast('Error fetching user', 'error');
      throw error;
    }
  }

  async showToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info'): Promise<void> {
    // Create toast container if not exists
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
      document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-bg-${type} border-0 show`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');

    // Toast body
    toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

    toastContainer.appendChild(toastEl);

    // Bootstrap toast instance
    const bsToast = new (window as any).bootstrap.Toast(toastEl, { delay: 3000 });
    bsToast.show();

    // Auto remove after hidden
    toastEl.addEventListener('hidden.bs.toast', () => {
      toastEl.remove();
    });
  }

  listenToUser(uid: string): Observable<User | undefined> {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    return docData(userDocRef, { idField: 'id' }) as Observable<User | undefined>;
  }
}