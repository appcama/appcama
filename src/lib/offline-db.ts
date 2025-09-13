import Dexie, { Table } from 'dexie';

export interface OfflineOperation {
  id?: number;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  table: string;
  data: any;
  originalId?: number;
  timestamp: number;
  status: 'PENDING' | 'SYNCING' | 'COMPLETED' | 'FAILED';
  retryCount: number;
  errorMessage?: string;
}

export interface CachedData {
  id?: number;
  table: string;
  originalId: number;
  data: any;
  lastSync: number;
  version: number;
  isDeleted: boolean;
}

export class OfflineDatabase extends Dexie {
  operations!: Table<OfflineOperation>;
  cachedData!: Table<CachedData>;

  constructor() {
    super('ReciclaEOfflineDB');
    this.version(1).stores({
      operations: '++id, table, status, timestamp',
      cachedData: '++id, table, originalId, lastSync'
    });
  }

  async addOperation(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'status' | 'retryCount'>) {
    return await this.operations.add({
      ...operation,
      timestamp: Date.now(),
      status: 'PENDING',
      retryCount: 0
    });
  }

  async getPendingOperations(): Promise<OfflineOperation[]> {
    return await this.operations
      .where('status')
      .equals('PENDING')
      .or('status')
      .equals('FAILED')
      .toArray();
  }

  async updateOperationStatus(id: number, status: OfflineOperation['status'], errorMessage?: string) {
    const updates: Partial<OfflineOperation> = { status };
    if (errorMessage) updates.errorMessage = errorMessage;
    if (status === 'FAILED') {
      const operation = await this.operations.get(id);
      if (operation) {
        updates.retryCount = operation.retryCount + 1;
      }
    }
    return await this.operations.update(id, updates);
  }

  async cacheData(table: string, originalId: number, data: any) {
    const existing = await this.cachedData
      .where({ table, originalId })
      .first();

    if (existing) {
      return await this.cachedData.update(existing.id!, {
        data,
        lastSync: Date.now(),
        version: existing.version + 1
      });
    } else {
      return await this.cachedData.add({
        table,
        originalId,
        data,
        lastSync: Date.now(),
        version: 1,
        isDeleted: false
      });
    }
  }

  async getCachedData(table: string): Promise<any[]> {
    const cached = await this.cachedData
      .where({ table, isDeleted: false })
      .toArray();
    
    return cached.map(item => ({
      ...item.data,
      _cached: true,
      _lastSync: item.lastSync
    }));
  }

  async clearCompletedOperations() {
    return await this.operations
      .where('status')
      .equals('COMPLETED')
      .delete();
  }
}

export const offlineDB = new OfflineDatabase();