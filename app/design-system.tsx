import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useAtom } from 'jotai'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CircleBar } from '@/components/ui/circle-bar'
import { ProgressBar } from '@/components/ui/progress-bar'
import { StatItem } from '@/components/ui/stat-item'
import { Text } from '@/components/ui/text'
import { colors, radius, spacing } from '@/constants/design-tokens'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { useColors } from '@/hooks/use-colors'
import { themeAtom } from '@/src/store/themeAtom'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="label" color="muted" uppercase>
        {title}
      </Text>
      {children}
    </View>
  )
}

function ColorSwatch({ name, value }: { name: string; value: string }) {
  return (
    <View style={styles.swatchRow}>
      <View style={[styles.swatch, { backgroundColor: value }]} />
      <View>
        <Text variant="caption" color="primary">
          {name}
        </Text>
        <Text variant="caption" color="muted">
          {value}
        </Text>
      </View>
    </View>
  )
}

export default function DesignSystemScreen() {
  const c = useColors()
  const scheme = useColorScheme()
  const [, setTheme] = useAtom(themeAtom)
  const isDark = scheme === 'dark'

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text variant="heading1">Design System</Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              Aliz — Clean & Performance
            </Text>
          </View>
          <Pressable
            onPress={() => setTheme(isDark ? 'light' : 'dark')}
            style={({ pressed }) => [
              styles.themePill,
              {
                backgroundColor: c.surfaceElevated,
                borderColor: c.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <MaterialIcons name="wb-sunny" size={15} color={isDark ? c.textMuted : c.primary} />
            <View style={[styles.pillDivider, { backgroundColor: c.border }]} />
            <MaterialIcons name="nights-stay" size={15} color={isDark ? c.primary : c.textMuted} />
          </Pressable>
        </View>

        {/* CIRCLE BARS */}
        <Section title="Circle Bars">
          {/* Grand ring — calories */}
          <Card>
            <View style={styles.ringRow}>
              <StatItem label="Mangées" value="1 478" unit="kcal" size="sm" trend="neutral" />
              <CircleBar value={1478} max={2323} size={160} strokeWidth={14} arcAngle={270}>
                <Text variant="heading2" style={{ fontWeight: '700' }}>
                  845
                </Text>
                <Text variant="caption" color="secondary">
                  Restantes
                </Text>
              </CircleBar>
              <StatItem label="Brûlées" value="142" unit="kcal" size="sm" trend="neutral" />
            </View>
          </Card>

          {/* Petits circles — repas */}
          <View style={styles.row}>
            <CircleBar value={322} max={566} size={56} strokeWidth={5} arcAngle={300} />
            <CircleBar value={721} max={755} size={56} strokeWidth={5} arcAngle={300} />
            <CircleBar
              value={45}
              max={200}
              size={56}
              strokeWidth={5}
              arcAngle={300}
              color={c.warning}
            />
            <CircleBar value={0} max={100} size={56} strokeWidth={5} arcAngle={300} />
          </View>

          {/* Variantes de taille */}
          <View style={styles.row}>
            <CircleBar value={75} max={100} size={80} strokeWidth={8} />
            <CircleBar value={40} max={100} size={80} strokeWidth={8} color={c.warning} />
            <CircleBar value={90} max={100} size={80} strokeWidth={8} color={c.info} />
            <CircleBar value={20} max={100} size={80} strokeWidth={8} color={c.danger} />
          </View>
        </Section>

        {/* COULEURS */}
        <Section title="Couleurs — dark">
          {Object.entries(colors.dark).map(([name, value]) => (
            <ColorSwatch key={name} name={name} value={value} />
          ))}
        </Section>

        {/* TYPOGRAPHIE */}
        <Section title="Typographie">
          <Text variant="display">1 650</Text>
          <Text variant="heading1">{"Aujourd'hui"}</Text>
          <Text variant="heading2">Mon frigo</Text>
          <Text variant="heading3">Recettes générées</Text>
          <Text variant="body">Vélo 3h · 1 200 kcal brûlées</Text>
          <Text variant="caption" color="secondary">
            Dernière pesée il y a 2 jours
          </Text>
          <Text variant="label" uppercase color="muted">
            Objectif du jour
          </Text>
        </Section>

        {/* BOUTONS */}
        <Section title="Boutons">
          <View style={styles.row}>
            <Button label="Générer" variant="primary" />
            <Button label="Annuler" variant="secondary" />
          </View>
          <View style={styles.row}>
            <Button label="Supprimer" variant="danger" />
            <Button label="Détails" variant="ghost" />
          </View>
          <Button label="Chargement…" variant="primary" loading fullWidth />
        </Section>

        {/* BADGES */}
        <Section title="Badges">
          <View style={styles.row}>
            <Badge label="Vélo" variant="success" />
            <Badge label="Attention" variant="warning" />
            <Badge label="Déficit élevé" variant="danger" />
            <Badge label="Repos" variant="neutral" />
          </View>
        </Section>

        {/* STAT ITEMS */}
        <Section title="Stat Items">
          <View style={styles.statsRow}>
            <StatItem label="Objectif" value="1 650" unit="kcal" size="md" trend="neutral" />
            <StatItem label="Déficit" value="-1 405" unit="kcal" size="md" trend="positive" />
            <StatItem label="Brûlées" value="1 200" unit="kcal" size="md" trend="neutral" />
          </View>
          <StatItem label="Poids actuel" value="98.4" unit="kg" size="lg" trend="positive" />
        </Section>

        {/* PROGRESS BARS */}
        <Section title="Barres de progression">
          <ProgressBar label="Protéines" value={120} max={180} color={c.primary} />
          <ProgressBar label="Glucides" value={165} max={220} color={c.warning} />
          <ProgressBar label="Lipides" value={45} max={75} color={c.info} />
        </Section>

        {/* CARDS */}
        <Section title="Cards">
          <Card>
            <Text variant="heading3">Card standard</Text>
            <Text variant="body" color="secondary">
              Surface avec border subtile et padding par défaut.
            </Text>
          </Card>
          <Card elevated>
            <Text variant="heading3">Card surélevée</Text>
            <Text variant="body" color="secondary">
              Légèrement plus foncée, pour les éléments mis en avant.
            </Text>
          </Card>
        </Section>

        {/* EXEMPLE CONCRET */}
        <Section title="Exemple — Tab Aujourd'hui">
          <Card>
            <View style={styles.cardHeader}>
              <Text variant="label" color="muted" uppercase>
                Objectif du jour
              </Text>
              <Badge label="Vélo 3h" variant="success" />
            </View>
            <StatItem
              label="Calories"
              value="1 800"
              unit="kcal"
              size="lg"
              trend="neutral"
              style={styles.bigStat}
            />
            <View style={styles.divider} />
            <View style={styles.statsRow}>
              <StatItem label="Déficit" value="-1 605" unit="kcal" size="sm" trend="positive" />
              <StatItem label="Brûlées" value="1 200" unit="kcal" size="sm" trend="neutral" />
              <StatItem label="Poids" value="98.4" unit="kg" size="sm" trend="neutral" />
            </View>
            <View style={[styles.divider, { marginTop: spacing.md }]} />
            <Text variant="label" color="muted" uppercase style={{ marginBottom: spacing.sm }}>
              Macros
            </Text>
            <View style={styles.macros}>
              <ProgressBar label="Protéines" value={120} max={180} color={c.primary} />
              <ProgressBar label="Glucides" value={165} max={220} color={c.warning} />
              <ProgressBar label="Lipides" value={45} max={75} color={c.info} />
            </View>
            <Button
              label="Générer des recettes"
              variant="primary"
              fullWidth
              style={{ marginTop: spacing.md }}
            />
          </Card>
        </Section>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    padding: spacing.md,
    gap: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subtitle: {
    marginTop: -spacing.xs,
  },
  themePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  pillDivider: {
    width: 1,
    height: 14,
  },
  section: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  bigStat: {
    marginVertical: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(148,163,184,0.15)',
    marginVertical: spacing.sm,
  },
  ringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  macros: {
    gap: spacing.md,
  },
})
