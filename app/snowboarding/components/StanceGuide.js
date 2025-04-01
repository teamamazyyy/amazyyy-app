'use client';

import { useState } from 'react';
import { FaInfoCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function StanceGuide({ stance, frontAngle, backAngle }) {
  const [showInfo, setShowInfo] = useState(false);
  const isGoofy = stance === 'goofy';

  const BindingAngle = ({ angle, label }) => (
    <div className="relative">
      <div className="w-20 h-20 border-2 border-gray-300 rounded-full relative">
        <motion.div
          className="absolute top-0 left-1/2 w-1 h-10 bg-blue-400 origin-bottom"
          style={{ rotate: `${angle}deg`, translateX: '-50%' }}
          animate={{ rotate: `${angle}deg` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-600">
          {angle}°
        </div>
      </div>
      <div className="text-center mt-2 text-sm font-medium text-gray-700">{label}</div>
    </div>
  );

  return (
    <div>
      (
        <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600 space-y-2">
          <p><strong>Stance Type ({stance}):</strong> {stance === 'regular' ? 'Left foot forward' : 'Right foot forward'}</p>
          <p><strong>Front Angle:</strong> Usually positive (pointing forward) for better control and power transfer.</p>
          <p><strong>Back Angle:</strong> Often negative (duck stance) or zero for better switch riding and stability.</p>
          <p><strong>Common Setups:</strong></p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>All-Mountain: +15° / -9° to +18° / -6°</li>
            <li>Freestyle: +15° / -15° (symmetrical for switch riding)</li>
            <li>Freeride: +21° / +6° to +27° / +6° (forward stance)</li>
          </ul>
        </div>
      )

      <div className="flex flex-col items-center space-y-6">
        {/* Board Visualization */}
        <div className="relative w-full max-w-4xl mx-auto h-48 rounded-lg overflow-hidden mb-4">
          {/* Board */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full sm:w-4/5 h-16 bg-gray-100 dark:bg-gray-700 rounded-[2rem] shadow-sm relative">
              {/* Board details */}
              <div className="absolute inset-0 border border-gray-200 dark:border-gray-600 rounded-[2rem]"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-1 bg-gray-200 dark:bg-gray-600"></div>
              </div>
            </div>
          </div>

          {/* Front Binding */}
          <div 
            className={`absolute w-12 sm:w-16 h-20 bg-blue-300 dark:bg-blue-600 rounded-[1.5rem] shadow-sm transition-all duration-300`}
            style={{
              left: isGoofy ? '70%' : '30%',
              top: '50%',
              transform: `translate(-50%, -50%) rotate(${isGoofy ? frontAngle : -frontAngle}deg)`,
            }}
          >
            <div className="absolute inset-0 border border-blue-400/30 dark:border-blue-500/30 rounded-[1.5rem]"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1 h-full bg-blue-400/50 dark:bg-blue-500/50"></div>
            </div>
            {/* Boot shape details */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3/4 h-3/4 border border-blue-400/20 dark:border-blue-500/20 rounded-xl"></div>
            </div>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1/2 h-1/2 border-t border-blue-400/20 dark:border-blue-500/20 rounded-t-xl"></div>
            {/* Angle value */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-medium text-blue-600 dark:text-blue-400">
              {frontAngle}°
            </div>
            {/* Front label */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-blue-600 dark:text-blue-400">
              Front
            </div>
          </div>

          {/* Back Binding */}
          <div 
            className={`absolute w-12 sm:w-16 h-20 bg-blue-300 dark:bg-blue-600 rounded-[1.5rem] shadow-sm transition-all duration-300`}
            style={{
              left: isGoofy ? '30%' : '70%',
              top: '50%',
              transform: `translate(-50%, -50%) rotate(${isGoofy ? backAngle : -backAngle}deg)`,
            }}
          >
            <div className="absolute inset-0 border border-blue-400/30 dark:border-blue-500/30 rounded-[1.5rem]"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1 h-full bg-blue-400/50 dark:bg-blue-500/50"></div>
            </div>
            {/* Boot shape details */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3/4 h-3/4 border border-blue-400/20 dark:border-blue-500/20 rounded-xl"></div>
            </div>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1/2 h-1/2 border-t border-blue-400/20 dark:border-blue-500/20 rounded-t-xl"></div>
            {/* Angle value */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-medium text-blue-600 dark:text-blue-400">
              {backAngle}°
            </div>
            {/* Back label */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-blue-600 dark:text-blue-400">
              Back
            </div>
          </div>
        </div>

        {/* Binding Angles Detail */}
        {/* <div className="flex justify-center space-x-12">
          <BindingAngle 
            angle={frontAngle} 
            label="Front Foot"
          />
          <BindingAngle 
            angle={backAngle} 
            label="Back Foot"
          />
        </div> */}
      </div>
    </div>
  );
} 