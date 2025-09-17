import { useState } from 'react';

export default function useBulkOperations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const executeBulkOperation = async (selectedItems, operation, onSuccess) => {
    setLoading(true);
    setError('');
    
    try {
      const promises = Array.from(selectedItems).map(operation);
      const results = await Promise.allSettled(promises);
      
      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        console.error('Some operations failed:', failed);
        setError(`Failed to process ${failed.length} item(s)`);
      }
      
      if (onSuccess) {
        onSuccess();
      }
      
      return {
        success: failed.length === 0,
        total: results.length,
        failed: failed.length
      };
    } catch (err) {
      setError('Operation failed');
      console.error('Bulk operation error:', err);
      return {
        success: false,
        total: selectedItems.size,
        failed: selectedItems.size
      };
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    error,
    setError,
    executeBulkOperation
  };
}