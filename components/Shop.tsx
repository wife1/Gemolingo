
import React from 'react';
import { UserState } from '../types';
import { Button } from './UI';
import { ArrowLeft, Zap, Snowflake, Lock, Heart } from 'lucide-react';

interface ShopProps {
  userState: UserState;
  onBack: () => void;
  onBuyFreeze: () => void;
}

export const Shop: React.FC<ShopProps> = ({ userState, onBack, onBuyFreeze }) => {
  const FREEZE_COST = 50;
  const canAfford = userState.xp >= FREEZE_COST;
  const isEquipped = userState.streakFreezeActive;

  return (
    <div className="max-w-md mx-auto h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center gap-4 border-b-2 border-gray-200 sticky top-0 z-10">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-gray-700">Power-up Shop</h1>
        <div className="ml-auto flex items-center gap-1 text-duo-yellow-dark font-bold bg-yellow-50 px-3 py-1 rounded-xl border-2 border-yellow-100">
          <Zap className="fill-current" size={20} /> {userState.xp}
        </div>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto pb-32">
        {/* Streak Freeze Item */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm">
           <div className="bg-blue-400 p-6 flex justify-center items-center relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-500 opacity-20 transform rotate-12 scale-150"></div>
              <Snowflake size={64} className="text-white drop-shadow-md relative z-10" />
              {isEquipped && (
                 <div className="absolute top-2 right-2 bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full border border-white/40">
                    EQUIPPED
                 </div>
              )}
           </div>
           
           <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                 <h3 className="text-xl font-bold text-gray-800">Streak Freeze</h3>
                 {!isEquipped && (
                     <div className="flex items-center gap-1 font-bold text-gray-600">
                        <Zap size={16} className="text-duo-yellow-dark fill-current" />
                        {FREEZE_COST}
                     </div>
                 )}
              </div>
              
              <p className="text-gray-500 mb-6 leading-relaxed">
                 Streak Freeze allows you to keep your streak in place for one additional day of inactivity.
              </p>

              {isEquipped ? (
                 <Button fullWidth variant="secondary" disabled className="opacity-50">
                    Active
                 </Button>
              ) : (
                 <Button 
                    fullWidth 
                    onClick={onBuyFreeze} 
                    disabled={!canAfford}
                    variant={canAfford ? 'primary' : 'outline'}
                 >
                    {canAfford ? 'Get for 50 XP' : 'Not enough XP'}
                 </Button>
              )}
           </div>
        </div>

        {/* Placeholder for future items */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 opacity-50 relative">
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 z-10">
               <div className="flex items-center gap-2 font-bold text-gray-400">
                  <Lock size={20} /> Coming Soon
               </div>
            </div>
            <div className="flex items-center gap-4 mb-4">
               <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center text-red-400">
                  <Heart size={32} className="fill-current" />
               </div>
               <div>
                  <h3 className="font-bold text-lg">Heart Refill</h3>
                  <p className="text-sm text-gray-400">Restore your hearts to full.</p>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};
