import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { COLORS } from '../theme/colors';

interface HairstylePreview {
  id: string;
  uri: string;
  title: string;
  description: string;
}

interface PreviewCarouselProps {
  hairstyles: HairstylePreview[];
  onPressItem?: (uri: string) => void;
}

const { width } = Dimensions.get('window');
const ITEM_SPACING = 10; // slightly tighter spacing to allow larger cards
const VISIBLE_ITEMS = 3; // previous • current • next
const ITEM_WIDTH = Math.round((width - ITEM_SPACING * (VISIBLE_ITEMS + 1)) / VISIBLE_ITEMS); // ~34% width target
const ITEM_HEIGHT = Math.round(ITEM_WIDTH * 1.15);
const CENTER_SCALE = 1.15;
const SIDE_SCALE = 0.9;

export const PreviewCarousel: React.FC<PreviewCarouselProps> = React.memo(({ hairstyles, onPressItem }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  
  const keyExtractor = (item: HairstylePreview, index: number) => `${index}-${item.id}`;

  const getItemLayout = (_: any, index: number) => ({
    length: ITEM_WIDTH + ITEM_SPACING,
    offset: (ITEM_WIDTH + ITEM_SPACING) * index,
    index,
  });

  const renderItem = ({ item, index }: { item: HairstylePreview; index: number }) => {
    const inputRange = [
      (index - 1) * (ITEM_WIDTH + ITEM_SPACING),
      index * (ITEM_WIDTH + ITEM_SPACING),
      (index + 1) * (ITEM_WIDTH + ITEM_SPACING),
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [SIDE_SCALE, CENTER_SCALE, SIDE_SCALE],
      extrapolate: 'clamp',
    });



    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [4, 0, 4],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[
        styles.card,
        {
          transform: [{ scale }, { translateY }]
        }
      ]}> 
        <TouchableOpacity activeOpacity={0.85} onPress={() => onPressItem?.(item.uri)}>
          <Image source={{ uri: item.uri }} style={styles.image} resizeMode="cover" accessibilityLabel="Preview hairstyle" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Prefetch first images to improve perceived performance
  useEffect(() => {
    (hairstyles.slice(0, 6)).forEach(hairstyle => Image.prefetch(hairstyle.uri));
  }, [hairstyles]);

  return (
    <View style={styles.container}>
      <Animated.FlatList
        horizontal
        data={hairstyles}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: ITEM_SPACING }}
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH + ITEM_SPACING}
        decelerationRate="fast"
        snapToAlignment="start"
        bounces={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        getItemLayout={getItemLayout}
        initialNumToRender={6}
        removeClippedSubviews
        windowSize={7}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%'
  },
  card: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    marginRight: ITEM_SPACING,
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },

});

