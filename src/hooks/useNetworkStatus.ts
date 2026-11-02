import { useNetInfo } from '@react-native-community/netinfo';
export function useNetworkStatus() {
  const { isConnected, isInternetReachable, type } = useNetInfo();
  return {
    online: isConnected !== false && isInternetReachable !== false,
    known: isConnected !== null,
    type,
  };
}
