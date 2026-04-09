import React from 'react';
import { FileText, Image, Presentation, File, AlignLeft } from 'lucide-react';

interface FileTypeIconProps {
  type: 'pdf' | 'word' | 'powerpoint' | 'image' | 'text';
  size?: number;
}

export default function FileTypeIcon({ type, size = 24 }: FileTypeIconProps) {
  const iconMap = {
    pdf: { icon: FileText, color: 'text-red-500', bg: 'bg-red-50' },
    word: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    powerpoint: { icon: Presentation, color: 'text-orange-500', bg: 'bg-orange-50' },
    image: { icon: Image, color: 'text-purple-500', bg: 'bg-purple-50' },
    text: { icon: AlignLeft, color: 'text-gray-600', bg: 'bg-gray-100' },
  };
  const config = iconMap[type] || { icon: File, color: 'text-gray-500', bg: 'bg-gray-100' };
  const Icon = config.icon;

  return (
    <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
      <Icon size={size} className={config.color} />
    </div>
  );
}
