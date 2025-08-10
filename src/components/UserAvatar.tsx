// UserAvatar component for profile display

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';

interface UserAvatarProps {
  username: string;
  initials?: string;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  username,
  initials,
  size = 'medium',
  onPress,
}) => {
  // Generate initials from username if not provided
  const displayInitials = initials || username
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  const sizeConfig = {
    small: { avatar: 24, text: 10, username: 8 },
    medium: { avatar: 32, text: 12, username: 10 },
    large: { avatar: 48, text: 16, username: 12 },
  };

  const config = sizeConfig[size];

  return (
    <View style={styles.container}>
      {onPress ? (
        <TouchableOpacity
          style={[
            styles.avatar,
            {
              width: config.avatar,
              height: config.avatar,
              borderRadius: config.avatar / 2,
            },
          ]}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.avatarText,
              { fontSize: config.text },
            ]}
          >
            {displayInitials}
          </Text>
        </TouchableOpacity>
      ) : (
        <View
          style={[
            styles.avatar,
            {
              width: config.avatar,
              height: config.avatar,
              borderRadius: config.avatar / 2,
            },
          ]}
        >
          <Text
            style={[
              styles.avatarText,
              { fontSize: config.text },
            ]}
          >
            {displayInitials}
          </Text>
        </View>
      )}
      <Text
        style={[
          styles.usernameText,
          { fontSize: config.username },
        ]}
        numberOfLines={1}
      >
        {username}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
  },
  avatar: {
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontWeight: '600',
    color: COLORS.purplePrimary,
  },
  usernameText: {
    color: COLORS.white,
    opacity: 0.9,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default UserAvatar;