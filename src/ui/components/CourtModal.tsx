import React, { ReactNode } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { X } from 'lucide-react-native';
import { useThemeStore } from '../../store/themeStore';

type CourtModalProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  icon?: ReactNode;
  children: ReactNode;
};

export function CourtModal({
  visible,
  title,
  subtitle,
  onClose,
  icon,
  children,
}: CourtModalProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className={`flex-1 items-center justify-center px-6 ${isDark ? 'bg-black/85' : 'bg-black/75'}`}>
        <View className={`absolute -left-10 top-20 h-28 w-28 rounded-full ${isDark ? 'bg-imperial-gold/15' : 'bg-imperial-gold/10'}`} />
        <View className={`absolute -right-12 bottom-24 h-36 w-36 rounded-full ${isDark ? 'bg-night-accent/35' : 'bg-imperial-green/10'}`} />

        <View className={`w-full max-w-sm overflow-hidden rounded-[32px] border shadow-2xl ${
          isDark ? 'border-white/10 bg-night-mid' : 'border-imperial-gold/30 bg-[#F7F0E3]'
        }`}>
          <View className="h-1.5 bg-imperial-gold" />

          <View className="flex-row items-start justify-between px-5 pb-4 pt-5">
            <View className="flex-1 flex-row items-center pr-3">
              {icon ? (
                <View className={`mr-3 h-12 w-12 items-center justify-center rounded-2xl border shadow-sm ${
                  isDark ? 'border-white/10 bg-white/5' : 'border-imperial-gold/30 bg-white'
                }`}>
                  {icon}
                </View>
              ) : null}
              <View className="flex-1">
                <Text className={`text-lg font-black ${isDark ? 'text-white' : 'text-imperial-brown'}`}>{title}</Text>
                {subtitle ? (
                  <Text className={`mt-1 text-sm leading-5 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>{subtitle}</Text>
                ) : null}
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              className={`h-10 w-10 items-center justify-center rounded-full border ${
                isDark ? 'border-white/10 bg-white/5' : 'border-stone-200 bg-white'
              }`}
            >
              <X color={isDark ? '#FFFFFF' : '#5E412F'} size={18} />
            </TouchableOpacity>
          </View>

          <View className="px-5 pb-5">{children}</View>
        </View>
      </View>
    </Modal>
  );
}
