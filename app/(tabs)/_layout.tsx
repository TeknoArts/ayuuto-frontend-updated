import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFD700',
        tabBarInactiveTintColor: '#9BA1A6',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#1a2332',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderTopWidth: 0,
          borderBottomWidth: 0,
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold',
          letterSpacing: 1,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'HOME',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={28} 
              name="house.fill" 
              color={focused ? '#FFD700' : '#9BA1A6'} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'SETTINGS',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={28} 
              name="gearshape.fill" 
              color={focused ? '#FFD700' : '#9BA1A6'} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
