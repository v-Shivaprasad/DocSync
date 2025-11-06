import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText } from 'lucide-react';

export default function NamePrompt() {
  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const { login } = useUser();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && userId.trim()) {
      login(name.trim(), userId.trim());
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <FileText className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Join the Document
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter your Name and User ID
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <Input
            id="name"
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            id="userid"
            type="text"
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />

          <Button type="submit" className="w-full">Join</Button>
        </form>
      </div>
    </div>
  );
}
