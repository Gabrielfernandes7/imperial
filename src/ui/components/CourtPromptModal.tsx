import React, { ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { CourtModal } from './CourtModal';
import { useThemeStore } from '../../store/themeStore';

type PromptButton = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
};

type CourtPromptModalProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  icon?: ReactNode;
  buttons: PromptButton[];
};

export function CourtPromptModal({
  visible,
  title,
  subtitle,
  onClose,
  icon,
  buttons,
}: CourtPromptModalProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <CourtModal visible={visible} title={title} subtitle={subtitle} onClose={onClose} icon={icon}>
      <View className="gap-2">
        {buttons.map((button) => {
          const variant =
            button.variant === 'destructive'
              ? isDark ? 'bg-red-950 border border-red-500/70' : 'bg-red-600'
              : button.variant === 'secondary'
                ? isDark ? 'bg-night-accent border border-white/20' : 'bg-stone-200'
                : isDark ? 'bg-imperial-gold' : 'bg-imperial-green';
          const textColor =
            button.variant === 'secondary'
              ? isDark ? 'text-white' : 'text-imperial-brown'
              : button.variant === 'destructive'
                ? 'text-white'
                : isDark ? 'text-night-deep' : 'text-imperial-cream';

          return (
            <TouchableOpacity
              key={button.label}
              onPress={button.onPress}
              className={`items-center rounded-2xl px-4 py-4 ${variant}`}
            >
              <Text className={`text-base font-bold ${textColor}`}>{button.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </CourtModal>
  );
}
