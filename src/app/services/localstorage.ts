import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Localstorage {
  setItem(key: string, value: any): void {
    try {
      const data = JSON.stringify(value);
      localStorage.setItem(key, data);
      console.log(`✅ Saved to localStorage: ${key} =`, value);
    } catch (error) {
      console.error('Error saving to localStorage', error);
    }
  }

  getItem<T>(key: string): T | null {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) as T : null;
  }

    getObject<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error('Error parsing localStorage item:', error);
      return null;
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }
  clearAll(): void {
    localStorage.clear();
  }

  updateField(key: string, field: string, value: any): void {
    const data = this.getItem<any>(key) || {};
    data[field] = value;
    this.setItem(key, data);
  }
}
