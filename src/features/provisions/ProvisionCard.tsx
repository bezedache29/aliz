import Ionicons from '@expo/vector-icons/Ionicons'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { useRef, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
import tw from 'twrnc'

import { Button } from '@/src/components/button'
import { ConfirmModal } from '@/src/components/confirm-modal'
import { Text } from '@/src/components/text'
import dayjs from '@/src/config/dayjs'
import { useColors } from '@/src/hooks/use-colors'
import {
  ExpiryStatus,
  StockCategory,
  StockItem,
  getDaysUntilExpiry,
  getExpiryStatus,
} from '@/src/models/stock/stock-item.model'

export const CATEGORY_COLORS: Record<StockCategory, (c: ReturnType<typeof useColors>) => string> = {
  Frais: (c) => c.primary,
  Sec: (c) => c.warning,
  Conserve: (c) => c.info,
  Surgelé: (c) => c.tertiary,
}

export const CATEGORY_ICONS: Record<StockCategory, React.ComponentProps<typeof Ionicons>['name']> =
  {
    Frais: 'leaf-outline',
    Sec: 'nutrition-outline',
    Conserve: 'cube-outline',
    Surgelé: 'snow-outline',
  }

const EXPIRY_STATUS_COLORS: Record<ExpiryStatus, (c: ReturnType<typeof useColors>) => string> = {
  expired: (c) => c.danger,
  critical: (c) => c.danger,
  warning: (c) => c.warning,
  ok: (c) => c.primary,
}

function formatExpiryLabel(item: StockItem): string | null {
  const days = getDaysUntilExpiry(item)
  if (days === null) return null
  if (days < 0) return `Expiré il y a ${Math.abs(days)}j`
  if (days === 0) return "Expire aujourd'hui"
  if (days === 1) return 'Expire demain'
  if (days <= 7) return `Expire dans ${days}j`
  return null
}

type Props = {
  item: StockItem
  onDelete: (id: string) => void
  onEdit?: (item: StockItem) => void
}

export function ProvisionCard({ item, onDelete, onEdit }: Props) {
  const c = useColors()
  const [expanded, setExpanded] = useState(false)
  const confirmRef = useRef<BottomSheetModal>(null)

  const status = getExpiryStatus(item)
  const catColor = CATEGORY_COLORS[item.category]?.(c) ?? c.textMuted
  const catIcon = CATEGORY_ICONS[item.category]
  const expiryColor = status ? EXPIRY_STATUS_COLORS[status](c) : c.textMuted
  const expiryLabel = formatExpiryLabel(item)
  const isUrgent = status === 'expired' || status === 'critical'

  return (
    <>
      <View
        style={[
          tw`rounded-2xl overflow-hidden mb-2`,
          {
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: expanded
              ? catColor
              : isUrgent || status === 'warning'
                ? expiryColor + '50'
                : c.border,
          },
        ]}
      >
        {/* En-tête — toujours visible */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setExpanded((v) => !v)}
          style={tw`flex-row items-center gap-3 px-3 py-3`}
        >
          {/* Icône catégorie */}
          <View
            style={[
              tw`w-10 h-10 rounded-xl items-center justify-center shrink-0`,
              { backgroundColor: catColor + '20' },
            ]}
          >
            <Ionicons name={catIcon} size={18} color={catColor} />
          </View>

          {/* Contenu */}
          <View style={tw`flex-1 gap-0.5`}>
            <View style={tw`flex-row items-center gap-2 flex-wrap`}>
              <Text variant="body" style={{ fontWeight: '700' }} numberOfLines={1}>
                {item.name}
              </Text>
              {item.state && (
                <View
                  style={[tw`px-1.5 py-0.5 rounded-md`, { backgroundColor: c.surfaceElevated }]}
                >
                  <Text variant="label" style={{ color: c.textSecondary, fontSize: 10 }}>
                    {item.state}
                  </Text>
                </View>
              )}
            </View>

            <View style={tw`flex-row items-center gap-2 flex-wrap`}>
              <Text variant="caption" color="secondary" style={{ fontWeight: '600' }}>
                {item.quantity} {item.unit}
              </Text>
              {item.brand ? (
                <Text variant="caption" color="muted">
                  {item.brand}
                </Text>
              ) : null}
              {item.per100g ? (
                <Text variant="caption" color="muted">
                  {item.per100g.kcal} kcal/100g
                </Text>
              ) : null}
            </View>

            {expiryLabel ? (
              <Text variant="label" style={{ color: expiryColor, fontWeight: '600', marginTop: 1 }}>
                {expiryLabel}
              </Text>
            ) : null}
          </View>

          {/* Chevron */}
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={c.textMuted} />
        </TouchableOpacity>

        {/* Détail — visible si expanded */}
        {expanded && (
          <View>
            <View style={[tw`h-px mx-3`, { backgroundColor: c.border }]} />

            <View style={tw`p-4 gap-4`}>
              {/* Infos générales */}
              <View style={tw`gap-2`}>
                <DetailRow
                  icon="pricetag-outline"
                  label="Catégorie"
                  value={item.category}
                  color={catColor}
                  c={c}
                />
                {item.brand && (
                  <DetailRow icon="business-outline" label="Marque" value={item.brand} c={c} />
                )}
                {item.state && (
                  <DetailRow
                    icon="information-circle-outline"
                    label="État"
                    value={item.state}
                    c={c}
                  />
                )}
                {item.expiryDate && (
                  <DetailRow
                    icon="calendar-outline"
                    label="DLC"
                    value={dayjs(item.expiryDate).format('DD/MM/YYYY')}
                    color={expiryColor}
                    c={c}
                  />
                )}
                <DetailRow
                  icon="time-outline"
                  label="Ajouté le"
                  value={dayjs(item.addedAt).format('DD/MM/YYYY')}
                  c={c}
                />
              </View>

              {/* Macros pour 100g */}
              {item.per100g && (
                <View style={tw`gap-2`}>
                  <Text variant="label" color="muted" uppercase style={{ letterSpacing: 0.6 }}>
                    Valeurs pour 100g
                  </Text>
                  <View
                    style={[
                      tw`flex-row rounded-xl p-3 gap-2`,
                      { backgroundColor: c.surfaceElevated },
                    ]}
                  >
                    <MacroChip
                      label="Kcal"
                      value={item.per100g.kcal}
                      unit="kcal"
                      color={c.warning}
                    />
                    <View style={[tw`w-px`, { backgroundColor: c.border }]} />
                    <MacroChip
                      label="Protéines"
                      value={item.per100g.proteines}
                      unit="g"
                      color={c.info}
                    />
                    <View style={[tw`w-px`, { backgroundColor: c.border }]} />
                    <MacroChip
                      label="Glucides"
                      value={item.per100g.glucides}
                      unit="g"
                      color={c.primary}
                    />
                    <View style={[tw`w-px`, { backgroundColor: c.border }]} />
                    <MacroChip
                      label="Lipides"
                      value={item.per100g.lipides}
                      unit="g"
                      color={c.tertiary}
                    />
                  </View>
                </View>
              )}

              {/* Boutons Modifier / Supprimer */}
              <View style={tw`flex-row gap-2`}>
                {onEdit && (
                  <Button
                    label="Modifier"
                    variant="warning"
                    onPress={() => onEdit(item)}
                    style={tw`flex-1`}
                  />
                )}
                <Button
                  label="Supprimer"
                  variant="danger"
                  onPress={() => confirmRef.current?.present()}
                  style={tw`flex-1`}
                />
              </View>
            </View>
          </View>
        )}
      </View>

      <ConfirmModal
        ref={confirmRef}
        title="Supprimer ?"
        message={`Supprimer "${item.name}" de tes provisions ?`}
        confirmLabel="Supprimer"
        onConfirm={() => onDelete(item.id)}
      />
    </>
  )
}

function DetailRow({
  icon,
  label,
  value,
  color,
  c,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name']
  label: string
  value: string
  color?: string
  c: ReturnType<typeof useColors>
}) {
  return (
    <View style={tw`flex-row items-center gap-3`}>
      <Ionicons name={icon} size={15} color={c.textMuted} />
      <Text variant="caption" color="muted" style={tw`w-20`}>
        {label}
      </Text>
      <Text variant="caption" style={{ fontWeight: '600', color: color ?? c.textPrimary, flex: 1 }}>
        {value}
      </Text>
    </View>
  )
}

function MacroChip({
  label,
  value,
  unit,
  color,
}: {
  label: string
  value: number
  unit: string
  color: string
}) {
  return (
    <View style={tw`flex-1 items-center gap-0.5`}>
      <Text style={{ fontWeight: '700', fontSize: 15, color }}>{Math.round(value)}</Text>
      <Text style={{ fontSize: 10, color, opacity: 0.75 }}>{unit}</Text>
      <Text style={{ fontSize: 9, color: '#888', marginTop: 1 }}>{label}</Text>
    </View>
  )
}
