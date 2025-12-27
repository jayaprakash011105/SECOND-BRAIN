// ===================================
// DATA MANAGER - LocalStorage Wrapper
// ===================================

class DataManager {
    constructor() {
        this.storageKey = 'secondBrainData';
        this.initializeStorage();
        this.listeners = new Set();
        this.setupCrossTabSync();
    }

    // Register a listener for any data update
    onUpdate(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback); // Returns unsubscribe function
    }

    // Trigger all listeners
    notifyListeners(database) {
        this.listeners.forEach(callback => callback(database));
    }

    // Setup listener for changes from other tabs
    setupCrossTabSync() {
        window.addEventListener('storage', (event) => {
            if (event.key === this.storageKey) {
                this.notifyListeners();
            }
        });
    }

    // Initialize storage with default structure
    initializeStorage() {
        if (!localStorage.getItem(this.storageKey)) {
            const defaultData = {
                goals: [],
                habits: [],
                tasks: [],
                reading: [],
                watchlist: [],
                projects: [],
                notes: [],
                finances: [],
                subscriptions: [],
                workouts: [],
                performance: [],
                shopping: [],
                recipes: []
            };
            localStorage.setItem(this.storageKey, JSON.stringify(defaultData));
        }
    }

    // Get all data
    getAllData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error reading data:', error);
            return null;
        }
    }

    // Get data for specific database
    getData(database) {
        const allData = this.getAllData();
        return allData ? allData[database] || [] : [];
    }

    // Save data for specific database
    saveData(database, data) {
        try {
            const allData = this.getAllData();
            allData[database] = data;
            localStorage.setItem(this.storageKey, JSON.stringify(allData));
            this.notifyListeners(database);
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    // Add item to database
    addItem(database, item) {
        const data = this.getData(database);
        item.id = this.generateId();
        item.createdAt = new Date().toISOString();
        data.push(item);
        return this.saveData(database, data) ? item : null;
    }

    // Update item in database
    updateItem(database, id, updates) {
        const data = this.getData(database);
        const index = data.findIndex(item => item.id === id);
        if (index !== -1) {
            data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() };
            return this.saveData(database, data) ? data[index] : null;
        }
        return null;
    }

    // Delete item from database
    deleteItem(database, id) {
        const data = this.getData(database);
        const filtered = data.filter(item => item.id !== id);
        return this.saveData(database, filtered);
    }

    // Get item by ID
    getItemById(database, id) {
        const data = this.getData(database);
        return data.find(item => item.id === id);
    }

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Search items
    searchItems(database, query, fields = []) {
        const data = this.getData(database);
        const lowerQuery = query.toLowerCase();

        return data.filter(item => {
            if (fields.length === 0) {
                // Search all string fields
                return Object.values(item).some(value =>
                    typeof value === 'string' && value.toLowerCase().includes(lowerQuery)
                );
            } else {
                // Search specific fields
                return fields.some(field =>
                    item[field] && item[field].toString().toLowerCase().includes(lowerQuery)
                );
            }
        });
    }

    // Filter items
    filterItems(database, filterFn) {
        const data = this.getData(database);
        return data.filter(filterFn);
    }

    // Sort items
    sortItems(database, sortFn) {
        const data = this.getData(database);
        return [...data].sort(sortFn);
    }

    // Export all data
    exportData() {
        const data = this.getAllData();
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `second-brain-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    // Import data
    importData(jsonData) {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    // Clear all data
    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            localStorage.removeItem(this.storageKey);
            this.initializeStorage();
            return true;
        }
        return false;
    }

    // Get related items (for relations between databases)
    getRelatedItems(sourceDatabase, sourceId, targetDatabase, relationField) {
        const sourceItem = this.getItemById(sourceDatabase, sourceId);
        if (!sourceItem || !sourceItem[relationField]) return [];

        const relatedIds = Array.isArray(sourceItem[relationField])
            ? sourceItem[relationField]
            : [sourceItem[relationField]];

        const targetData = this.getData(targetDatabase);
        return targetData.filter(item => relatedIds.includes(item.id));
    }

    // Add relation
    addRelation(database, itemId, relationField, relatedId) {
        const item = this.getItemById(database, itemId);
        if (!item) return false;

        if (!item[relationField]) {
            item[relationField] = [];
        }

        if (!Array.isArray(item[relationField])) {
            item[relationField] = [item[relationField]];
        }

        if (!item[relationField].includes(relatedId)) {
            item[relationField].push(relatedId);
            return this.updateItem(database, itemId, { [relationField]: item[relationField] });
        }

        return true;
    }

    // Remove relation
    removeRelation(database, itemId, relationField, relatedId) {
        const item = this.getItemById(database, itemId);
        if (!item || !item[relationField]) return false;

        const relations = Array.isArray(item[relationField])
            ? item[relationField]
            : [item[relationField]];

        const filtered = relations.filter(id => id !== relatedId);
        return this.updateItem(database, itemId, { [relationField]: filtered });
    }
}

// Create global instance
const dataManager = new DataManager();
