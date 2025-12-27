import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import {
    getFirestore,
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyArIz45wrOmtXrhTJKkkB8FJicDL-5rR8A",
    authDomain: "second-brain-cd23d.firebaseapp.com",
    projectId: "second-brain-cd23d",
    storageBucket: "second-brain-cd23d.firebasestorage.app",
    messagingSenderId: "112365274400",
    appId: "1:112365274400:web:bc2742e9a7209cc3c5c345",
    measurementId: "G-15NZSBRPM0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

class DataManager {
    constructor() {
        this.listeners = [];
        this.data = {
            tasks: [],
            habits: [],
            finances: [],
            projects: [],
            goals: []
        };
        this.user = null;
        this.unsubscribeFunctions = {};

        // Initialize Auth Listener
        onAuthStateChanged(auth, (user) => {
            this.user = user;
            if (user) {
                console.log('User logged in:', user.email);
                this.initializeRealtimeSync();
                document.body.classList.add('logged-in');
            } else {
                console.log('User logged out');
                this.clearData();
                document.body.classList.remove('logged-in');
                this.notifyListeners();
            }
            this.updateAuthUI();
        });
    }

    // Auth Methods
    async login() {
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Login failed:", error);
            alert("Login failed: " + error.message);
        }
    }

    async logout() {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout failed:", error);
        }
    }

    // Real-time Sync
    initializeRealtimeSync() {
        if (!this.user) return;

        const collections = ['tasks', 'habits', 'finances', 'projects', 'goals'];

        collections.forEach(colName => {
            // Unsubscribe previous listener if exists
            if (this.unsubscribeFunctions[colName]) {
                this.unsubscribeFunctions[colName]();
            }

            const q = query(collection(db, colName), where("userId", "==", this.user.uid));

            this.unsubscribeFunctions[colName] = onSnapshot(q, (snapshot) => {
                this.data[colName] = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                this.notifyListeners(colName);
            }, (error) => {
                console.error(`Error syncing ${colName}:`, error);
            });
        });
    }

    clearData() {
        this.data = {
            tasks: [],
            habits: [],
            finances: [],
            projects: [],
            goals: []
        };
        Object.values(this.unsubscribeFunctions).forEach(unsubscribe => unsubscribe());
        this.unsubscribeFunctions = {};
    }

    // CRUD Operations
    getData(key) {
        return this.data[key] || [];
    }

    getItemById(key, id) {
        return this.data[key]?.find(item => item.id === id);
    }

    async addItem(key, item) {
        if (!this.user) {
            alert("Please login to add items.");
            return;
        }

        try {
            const newItem = {
                ...item,
                userId: this.user.uid,
                createdAt: new Date().toISOString()
            };
            await addDoc(collection(db, key), newItem);
        } catch (error) {
            console.error("Error adding item:", error);
            throw error;
        }
    }

    async updateItem(key, id, updates) {
        if (!this.user) return;

        try {
            const itemRef = doc(db, key, id);
            await updateDoc(itemRef, {
                ...updates,
                updatedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error("Error updating item:", error);
            throw error;
        }
    }

    async deleteItem(key, id) {
        if (!this.user) return;

        try {
            await deleteDoc(doc(db, key, id));
        } catch (error) {
            console.error("Error deleting item:", error);
            throw error;
        }
    }

    // Listeners
    onUpdate(callback) {
        this.listeners.push(callback);
    }

    notifyListeners(key = null) {
        this.listeners.forEach(callback => callback(key));
    }

    // UI Helper
    updateAuthUI() {
        const loginBtn = document.getElementById('loginBtn');
        const userProfile = document.getElementById('userProfile');
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');

        if (this.user) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (userProfile) {
                userProfile.style.display = 'flex';
                if (userName) userName.textContent = this.user.displayName;
                if (userAvatar) userAvatar.src = this.user.photoURL;
            }
        } else {
            if (loginBtn) loginBtn.style.display = 'block';
            if (userProfile) userProfile.style.display = 'none';
        }
    }
}

// Export singleton
window.dataManager = new DataManager();
