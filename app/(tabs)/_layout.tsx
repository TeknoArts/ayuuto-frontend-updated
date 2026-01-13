import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <View style={{ flex: 1, backgroundColor: 'rgb(1 27 61)' }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#FFD700',
          tabBarInactiveTintColor: '#9BA1A6',
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            backgroundColor: 'rgb(0 10 26)',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderWidth: 1,
            borderBottomWidth: 0,
            borderColor: '#1a2332',
            height: 100,
            paddingBottom: 20,
            paddingTop: 10,
            // Shadow for iOS
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -10 },
            shadowOpacity: 0.5,
            shadowRadius: 12,
            // Elevation for Android
            elevation: 12,
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
        <Tabs.Screen
          name="newgroup"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="add-participants"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="collection"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="group-created"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="group-details"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="payment-processing"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="next-round"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="activity-log"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="group-activity-log"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="manage-participants"
          options={{
            href: null, // Hide from tab bar
          }}
        />
      </Tabs>
    </View>
  );
}
