import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { RefreshControl, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import tw from 'twrnc'

import { useStravaDisconnect } from '@/src/apis/backendApi/hooks/strava/useStravaDisconnect'
import { useStravaStatus } from '@/src/apis/backendApi/hooks/strava/useStravaStatus'
import { Button } from '@/src/components/button'
import { Card } from '@/src/components/card'
import { ScreenHeader } from '@/src/components/screen-header'
import { ScrollView } from '@/src/components/scroll-view'
import { Text } from '@/src/components/text'
import { StravaConnectButton } from '@/src/features/tracking/StravaConnectButton'
import { useColors } from '@/src/hooks/use-colors'
import { useRefresh } from '@/src/hooks/use-refresh'

const STRAVA_COLOR = '#FC4C02'

export default function SettingsScreen() {
  const c = useColors()
  const { data: stravaStatus, isLoading, refetch } = useStravaStatus()
  const { mutate: disconnectStrava, isPending: isDisconnecting } = useStravaDisconnect()
  const { refreshing, refresh } = useRefresh(() => refetch().then(() => {}))

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={{ flex: 1, backgroundColor: c.background }}
    >
      <ScreenHeader title="Paramètres" />

      <ScrollView
        contentContainerStyle={tw`p-4 gap-4`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={c.primary}
            colors={[c.primary]}
          />
        }
      >
        <View style={tw`gap-2`}>
          <Text variant="label" color="muted" uppercase style={{ letterSpacing: 0.8 }}>
            Strava
          </Text>
          <Card>
            <View style={tw`flex-row items-center gap-3`}>
              <View
                style={[
                  tw`w-11 h-11 rounded-full items-center justify-center border`,
                  { backgroundColor: `${STRAVA_COLOR}15`, borderColor: `${STRAVA_COLOR}40` },
                ]}
              >
                <FontAwesome5 name="strava" size={18} color={STRAVA_COLOR} />
              </View>

              <View style={tw`flex-1`}>
                {isLoading ? (
                  <Text variant="body" color="muted">
                    Chargement...
                  </Text>
                ) : stravaStatus?.connected ? (
                  <>
                    <Text variant="body" style={{ fontWeight: '600' }}>
                      Connecté{stravaStatus.athleteName ? ` — ${stravaStatus.athleteName}` : ''}
                    </Text>
                    <Text variant="caption" color="muted">
                      Les activités sont synchronisées depuis Strava.
                    </Text>
                  </>
                ) : (
                  <Text variant="body" color="muted">
                    Aucun compte Strava connecté.
                  </Text>
                )}
              </View>

              {!isLoading &&
                (stravaStatus?.connected ? (
                  <Button
                    label="Déconnecter Strava"
                    variant="danger"
                    size="md"
                    icon="log-out-outline"
                    iconOnly
                    loading={isDisconnecting}
                    onPress={() => disconnectStrava()}
                  />
                ) : (
                  <StravaConnectButton />
                ))}
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
