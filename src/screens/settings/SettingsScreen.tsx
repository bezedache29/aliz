import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useAtom } from 'jotai'
import { Linking, RefreshControl, Switch, TouchableOpacity, View } from 'react-native'
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
import { notificationPermissionGrantedAtom } from '@/src/store/notificationPermissionAtom'
import { notificationsAtom } from '@/src/store/notificationsAtom'
import { requestNotificationPermissionsAsync } from '@/src/utils/notifications'

const STRAVA_COLOR = '#FC4C02'

export default function SettingsScreen() {
  const c = useColors()
  const { data: stravaStatus, isLoading, refetch } = useStravaStatus()
  const { mutate: disconnectStrava, isPending: isDisconnecting } = useStravaDisconnect()
  const { refreshing, refresh } = useRefresh(() => refetch().then(() => {}))
  const [notifState, setNotifState] = useAtom(notificationsAtom)
  const [permissionGranted, setPermissionGranted] = useAtom(notificationPermissionGrantedAtom)

  const effectiveEnabled = notifState.enabled && permissionGranted

  async function handleToggleEnabled(next: boolean) {
    if (next) {
      const granted = await requestNotificationPermissionsAsync()
      setPermissionGranted(granted)
      if (!granted) {
        Linking.openSettings()
        return
      }
    }
    setNotifState((prev) => ({ ...prev, enabled: next }))
  }

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

        <View style={tw`gap-2`}>
          <Text variant="label" color="muted" uppercase style={{ letterSpacing: 0.8 }}>
            Notifications
          </Text>
          <Card style={tw`gap-4`}>
            {!permissionGranted && (
              <View
                style={[
                  tw`flex-row items-center gap-2 p-3 rounded-xl`,
                  { backgroundColor: `${c.warning}15` },
                ]}
              >
                <Ionicons name="warning-outline" size={18} color={c.warning} />
                <Text variant="caption" style={{ color: c.warning, flex: 1 }}>
                  Désactivées dans les réglages du téléphone.
                </Text>
                <TouchableOpacity onPress={() => Linking.openSettings()}>
                  <Text variant="caption" style={{ color: c.warning, fontWeight: '700' }}>
                    Ouvrir
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <NotificationToggleRow
              title="Activer les notifications"
              description="Active ou coupe tous les rappels de l'application"
              value={effectiveEnabled}
              onValueChange={handleToggleEnabled}
            />

            <View style={[tw`h-px`, { backgroundColor: c.border }]} />

            <NotificationToggleRow
              title="Rappel quotidien (12h)"
              description="Te notifie si tu n'as pas encore ouvert aliz"
              value={notifState.appReminderEnabled}
              onValueChange={(appReminderEnabled) =>
                setNotifState((prev) => ({ ...prev, appReminderEnabled }))
              }
              disabled={!effectiveEnabled}
            />

            <NotificationToggleRow
              title="Provisions expirantes"
              description="Alerte quand des provisions expirent bientôt"
              value={notifState.expiringStockEnabled}
              onValueChange={(expiringStockEnabled) =>
                setNotifState((prev) => ({ ...prev, expiringStockEnabled }))
              }
              disabled={!effectiveEnabled}
            />
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

type NotificationToggleRowProps = {
  title: string
  description: string
  value: boolean
  onValueChange: (value: boolean) => void
  disabled?: boolean
}

function NotificationToggleRow({
  title,
  description,
  value,
  onValueChange,
  disabled = false,
}: NotificationToggleRowProps) {
  const c = useColors()

  return (
    <View style={tw`flex-row items-center justify-between gap-3`}>
      <View style={[tw`flex-1`, disabled && { opacity: 0.5 }]}>
        <Text variant="body" style={{ fontWeight: '600' }}>
          {title}
        </Text>
        <Text variant="caption" color="muted">
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: c.border, true: c.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  )
}
