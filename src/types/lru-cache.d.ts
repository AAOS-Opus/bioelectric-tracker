declare module 'lru-cache' {
  interface LRUCacheOptions<K, V> {
    max?: number;
    ttl?: number;
    updateAgeOnGet?: boolean;
  }

  class LRUCache<K, V> {
    constructor(options?: LRUCacheOptions<K, V>);
    set(key: K, value: V): void;
    get(key: K): V | undefined;
    clear(): void;
  }

  export default LRUCache;
}