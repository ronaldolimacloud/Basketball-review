import React, { useState } from 'react';
import { uploadData, getUrl } from 'aws-amplify/storage';

export const StorageDiagnostic: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testStorage = async () => {
    setLoading(true);
    setTestResult('Testing storage...\n');
    
    try {
      // Test 1: Create a simple test file
      const testContent = new Blob(['Test content'], { type: 'text/plain' });
      const testPath = `player-images/test-${Date.now()}.txt`;
      
      setTestResult(prev => prev + `Uploading to path: ${testPath}\n`);
      
      const uploadResult = await uploadData({
        path: testPath,
        data: testContent,
        options: {
          contentType: 'text/plain'
        }
      }).result;
      
      setTestResult(prev => prev + `Upload successful: ${JSON.stringify(uploadResult)}\n`);
      
      // Test 2: Try to get URL for the uploaded file
      setTestResult(prev => prev + 'Getting URL...\n');
      
      const urlResult = await getUrl({
        path: testPath,
        options: {
          expiresIn: 3600
        }
      });
      
      setTestResult(prev => prev + `URL generated: ${urlResult.url.toString()}\n`);
      setTestResult(prev => prev + 'Storage test completed successfully!\n');
      
    } catch (error) {
      setTestResult(prev => prev + `Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      console.error('Storage test error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testImageUpload = async (file: File) => {
    setLoading(true);
    setTestResult('Testing image upload...\n');
    
    try {
      const testPath = `player-images/test-image-${Date.now()}-${file.name}`;
      
      setTestResult(prev => prev + `Uploading image to: ${testPath}\n`);
      
      const uploadResult = await uploadData({
        path: testPath,
        data: file,
        options: {
          contentType: file.type || 'image/jpeg'
        }
      }).result;
      
      setTestResult(prev => prev + `Upload successful: ${JSON.stringify(uploadResult)}\n`);
      
      // Get URL for the image
      const urlResult = await getUrl({
        path: testPath,
        options: {
          expiresIn: 3600
        }
      });
      
      setTestResult(prev => prev + `Image URL: ${urlResult.url.toString()}\n`);
      setTestResult(prev => prev + 'Image upload test completed successfully!\n');
      
    } catch (error) {
      setTestResult(prev => prev + `Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      console.error('Image upload test error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg mb-6">
      <h3 className="text-lg font-semibold text-yellow-400 mb-4">Storage Diagnostic</h3>
      
      <div className="flex gap-4 mb-4">
        <button
          onClick={testStorage}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 px-4 py-2 rounded-lg font-medium text-white"
        >
          Test Basic Storage
        </button>
        
        <label className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium text-white cursor-pointer">
          Test Image Upload
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) testImageUpload(file);
            }}
          />
        </label>
      </div>
      
      <pre className="bg-slate-900 p-4 rounded text-green-400 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
        {testResult || 'Click a button above to test storage functionality...'}
      </pre>
    </div>
  );
}; 