import React, { ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { CourtModal } from './CourtModal';

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
  return (
    <CourtModal visible={visible} title={title} subtitle={subtitle} onClose={onClose} icon={icon}>
      <View className="gap-2">
        {buttons.map((button) => {
          const variant =
            button.variant === 'destructive'
              ? 'bg-red-600'
              : button.variant === 'secondary'
                ? 'bg-stone-200'
                : 'bg-imperial-green';
          const textColor =
            button.variant === 'secondary'
              ? 'text-imperial-brown'
              : button.variant === 'destructive'
                ? 'text-white'
                : 'text-imperial-cream';

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
