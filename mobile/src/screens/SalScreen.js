import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  Card,
  NativeScreen,
  PrimaryButton,
} from '../components/native/NativeLayout';
import { useAuth } from '../auth/AuthContext';
import { getAccessModel } from '../lib/access';
import {
  askSal,
  getCurrentGames,
  getOddsBoard,
  getPlayerStats,
  getTeamStats,
  spendSearchCredit,
} from '../lib/swhApi';
import PurchaseModal from '../PurchaseModal';
import { colors, radius, spacing } from '../theme/nativeTheme';

const salImage = require('../../assets/sal.jpeg');

const WORKFLOWS = [
  { key: 'games', label: "Today's Games" },
  { key: 'odds', label: 'Best Odds' },
  { key: 'player', label: 'Player Lookup' },
  { key: 'team', label: 'Team Lookup' },
];

export default function SalScreen({ route }) {
  const { account, refreshAccount, session } = useAuth();
  const access = getAccessModel(account);
  const scrollRef = useRef(null);
  const lastRoutePrompt = useRef(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState('');
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [workflow, setWorkflow] = useState(route?.params?.workflow || '');
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [workflowError, setWorkflowError] = useState('');
  const [games, setGames] = useState([]);
  const [odds, setOdds] = useState([]);
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState(null);

  useEffect(() => {
    const prompt = route?.params?.prompt;
    if (prompt && prompt !== lastRoutePrompt.current) {
      lastRoutePrompt.current = prompt;
      setInput(prompt);
    }
  }, [route?.params?.prompt]);

  useEffect(() => {
    if (route?.params?.workflow) {
      setWorkflow(route.params.workflow);
    }
  }, [route?.params?.workflow]);

  useEffect(() => {
    if (messages.length) {
      setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 80);
    }
  }, [messages, isThinking]);

  const handlePurchaseComplete = () => {
    refreshAccount();
    setTimeout(refreshAccount, 3500);
    setTimeout(refreshAccount, 9000);
  };

  const missingContextFollowUp = (text) => {
    const lower = String(text || '').toLowerCase().trim();
    if (/how is (this|the|that)?\s*player\b/.test(lower) || /^player stats\??$/.test(lower)) {
      return 'Which player do you want me to look up?';
    }
    if (/how is (this|the|that)?\s*team\b/.test(lower) || /^team stats\??$/.test(lower)) {
      return 'Which team do you want me to look up?';
    }
    if (/matchup read/.test(lower) && !/\b(vs\.?|versus| at )\b/.test(lower)) {
      return 'Which matchup do you want me to read?';
    }
    if (/best odds/.test(lower) && !/\b(nba|nfl|mlb|nhl|game|today|tonight|team| vs\.?| at )\b/.test(lower)) {
      return 'Which game or sport do you want odds for?';
    }
    return '';
  };

  const sendMessage = async (overrideText) => {
    const text = String(overrideText ?? input).trim();
    if (!text || isThinking) return;

    setError('');
    setInput('');
    const userMessage = { id: `u_${Date.now()}`, role: 'user', content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setIsThinking(true);

    try {
      const followUp = missingContextFollowUp(text);
      if (followUp) {
        setMessages((current) => [
          ...current,
          {
            id: `f_${Date.now()}`,
            role: 'assistant',
            content: followUp,
          },
        ]);
        return;
      }

      if (!access.isUnlimited) {
        await spendSearchCredit(session?.access_token);
      }

      const history = nextMessages.slice(-7, -1).map((message) => ({
        role: message.role,
        content: message.content,
      }));
      const result = await askSal({
        token: session?.access_token,
        message: text,
        history,
      });

      setMessages((current) => [
        ...current,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          content: result?.reply || 'S.A.L. did not return a response. Please try again.',
        },
      ]);
      refreshAccount();
    } catch (err) {
      if (err?.status === 402 || err?.code === 'NO_SEARCHES_REMAINING') {
        setError('You are out of searches. Buy credits to keep asking S.A.L.');
      } else {
        setError(err?.message || 'S.A.L. could not complete that request.');
      }
      setMessages((current) => [
        ...current,
        {
          id: `e_${Date.now()}`,
          role: 'assistant',
          content: err?.status === 402 || err?.code === 'NO_SEARCHES_REMAINING'
            ? 'You are out of searches. Add credits to continue.'
            : 'The request failed before S.A.L. could finish. No answer was fabricated.',
          isError: true,
        },
      ]);
      refreshAccount();
    } finally {
      setIsThinking(false);
    }
  };

  const openWorkflow = async (nextWorkflow) => {
    setWorkflow(nextWorkflow);
    setWorkflowError('');
    setLookupResult(null);

    if (nextWorkflow === 'games') {
      setWorkflowLoading(true);
      try {
        setGames(await getCurrentGames(session?.access_token));
      } catch (err) {
        setWorkflowError(err?.message || 'Current games could not be loaded.');
      } finally {
        setWorkflowLoading(false);
      }
    }

    if (nextWorkflow === 'odds') {
      setWorkflowLoading(true);
      try {
        setOdds(await getOddsBoard(session?.access_token));
      } catch (err) {
        setWorkflowError(err?.message || 'Current odds could not be loaded.');
      } finally {
        setWorkflowLoading(false);
      }
    }
  };

  useEffect(() => {
    if (workflow === 'games' && games.length === 0 && !workflowLoading) {
      openWorkflow('games');
    }
    if (workflow === 'odds' && odds.length === 0 && !workflowLoading) {
      openWorkflow('odds');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflow]);

  const lookupEntity = async () => {
    const query = lookupQuery.trim();
    if (!query || workflowLoading) return;

    setWorkflowError('');
    setLookupResult(null);
    setWorkflowLoading(true);
    try {
      const result = workflow === 'team'
        ? await getTeamStats({ token: session?.access_token, teamName: query })
        : await getPlayerStats({ token: session?.access_token, playerName: query });
      setLookupResult(result);
    } catch (err) {
      setWorkflowError(err?.message || 'Lookup failed.');
    } finally {
      setWorkflowLoading(false);
    }
  };

  const describeGame = (game) => {
    const teams = game.competitors?.length
      ? game.competitors.map((team) => `${team.name}${team.score ? ` ${team.score}` : ''}`).join(' vs ')
      : game.name;
    return `${game.sport}: ${teams}${game.status ? ` - ${game.status}` : ''}${game.venue ? ` at ${game.venue}` : ''}`;
  };

  const describeOdds = (row) => {
    const outcomes = row.outcomes
      .slice(0, 4)
      .map((outcome) => {
        const price = Number(outcome.price);
        const oddsPrice = Number.isFinite(price) && price > 0 ? `+${price}` : outcome.price;
        const point = outcome.point === undefined || outcome.point === null ? '' : ` ${outcome.point}`;
        return `${outcome.market}: ${outcome.name}${point} ${oddsPrice}`;
      })
      .join('; ');
    return `${row.sport}: ${row.matchup} (${row.bookmaker})${outcomes ? ` - ${outcomes}` : ''}`;
  };

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <NativeScreen
          eyebrow="Sports Analysis Librarian"
          title="Ask S.A.L."
          subtitle="A focused pocket analyst for quick game, player, team, and odds questions."
        >
          <Card accent="purple" style={styles.heroCard}>
            <Image source={salImage} resizeMode="contain" style={styles.fullOwl} />
            <Text style={styles.greeting}>Ready when you are.</Text>
            <Text style={styles.body}>
              Bring a matchup, player, team, or line. S.A.L. keeps the first read
              fast, focused, and easy to follow.
            </Text>
            <Text style={styles.accessLine}>{access.label}</Text>
          </Card>

          <Card accent="blue">
            <Text style={styles.sectionTitle}>Quick workflows</Text>
            <View style={styles.workflowGrid}>
              {WORKFLOWS.map((item) => (
                <View key={item.key} style={styles.workflowButton}>
                  <PrimaryButton
                    variant="secondary"
                    onPress={() => openWorkflow(item.key)}
                    disabled={isThinking}
                  >
                    {item.label}
                  </PrimaryButton>
                </View>
              ))}
            </View>
            {workflow ? (
              <WorkflowPanel
                describeGame={describeGame}
                describeOdds={describeOdds}
                games={games}
                isLoading={workflowLoading}
                lookupEntity={lookupEntity}
                lookupQuery={lookupQuery}
                lookupResult={lookupResult}
                odds={odds}
                onLookupQueryChange={setLookupQuery}
                onSend={sendMessage}
                type={workflow}
                workflowError={workflowError}
              />
            ) : null}
          </Card>

          <Card accent="cyan">
            <Text style={styles.sectionTitle}>Conversation</Text>
            {messages.length === 0 ? (
              <View style={styles.messagePlaceholder}>
                <Text style={styles.placeholderText}>Ask a real question.</Text>
                <Text style={styles.placeholderDetail}>
                  S.A.L. will call the live SWH backend. Answers are not mocked.
                </Text>
              </View>
            ) : (
              <ScrollView ref={scrollRef} style={styles.messageList} nestedScrollEnabled>
                {messages.map((message) => (
                  <View
                    key={message.id}
                    style={[
                      styles.messageBubble,
                      message.role === 'user' ? styles.userBubble : styles.salBubble,
                      message.isError && styles.errorBubble,
                    ]}
                  >
                    <Text style={styles.messageRole}>
                      {message.role === 'user' ? 'You' : 'S.A.L.'}
                    </Text>
                    <Text style={styles.messageText}>{message.content}</Text>
                  </View>
                ))}
                {isThinking ? (
                  <View style={[styles.messageBubble, styles.salBubble]}>
                    <ActivityIndicator color={colors.cyan} />
                    <Text style={styles.thinkingText}>S.A.L. is thinking...</Text>
                  </View>
                ) : null}
              </ScrollView>
            )}
          </Card>

          {error ? (
            <Card accent="orange">
              <Text style={styles.errorText}>{error}</Text>
              {!access.isUnlimited ? (
                <View style={styles.errorAction}>
                  <PrimaryButton onPress={() => setPurchaseOpen(true)}>
                    Buy Credits
                  </PrimaryButton>
                </View>
              ) : null}
            </Card>
          ) : null}

          <View style={styles.inputShell}>
            <TextInput
              editable={!isThinking}
              multiline
              onChangeText={setInput}
              placeholder="Ask about a game, player, team, or pick..."
              placeholderTextColor={colors.dim}
              style={styles.input}
              value={input}
            />
            <PrimaryButton
              variant="secondary"
              onPress={() => sendMessage()}
              disabled={isThinking || !input.trim()}
            >
              Send
            </PrimaryButton>
          </View>
        </NativeScreen>
      </KeyboardAvoidingView>
      <PurchaseModal
        visible={purchaseOpen}
        onClose={() => setPurchaseOpen(false)}
        onPurchaseComplete={handlePurchaseComplete}
      />
    </>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    backgroundColor: colors.background,
    flex: 1,
  },
  heroCard: {
    alignItems: 'center',
  },
  fullOwl: {
    height: 300,
    marginBottom: spacing.md,
    width: '100%',
  },
  greeting: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  body: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  accessLine: {
    color: colors.green,
    fontSize: 14,
    fontWeight: '900',
    marginTop: spacing.md,
  },
  workflowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  workflowButton: {
    marginBottom: spacing.sm,
    width: '48%',
  },
  workflowState: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    padding: spacing.md,
  },
  workflowMuted: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.sm,
  },
  workflowEmpty: {
    color: colors.dim,
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: spacing.sm,
  },
  workflowError: {
    color: '#fed7aa',
    fontSize: 14,
    lineHeight: 20,
  },
  selectableRow: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  pressedRow: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  selectableTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  selectableDetail: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  lookupShell: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  lookupInput: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderBright,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontSize: 15,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  lookupButton: {
    minWidth: 104,
  },
  lookupResult: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  lookupTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: spacing.md,
  },
  messagePlaceholder: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    minHeight: 180,
    justifyContent: 'center',
    padding: spacing.md,
  },
  placeholderText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  placeholderDetail: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  messageList: {
    maxHeight: 360,
  },
  messageBubble: {
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  userBubble: {
    backgroundColor: '#12324a',
    marginLeft: spacing.lg,
  },
  salBubble: {
    backgroundColor: colors.surfaceElevated,
    marginRight: spacing.lg,
  },
  errorBubble: {
    borderColor: colors.orange,
    borderWidth: 1,
  },
  messageRole: {
    color: colors.cyan,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  messageText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  thinkingText: {
    color: colors.muted,
    fontSize: 13,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    color: '#fed7aa',
    fontSize: 14,
    lineHeight: 20,
  },
  errorAction: {
    marginTop: spacing.md,
  },
  inputShell: {
    backgroundColor: colors.surface,
    borderColor: colors.borderBright,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    padding: spacing.sm,
  },
  input: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    maxHeight: 120,
    minHeight: 52,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
});

function WorkflowPanel({
  describeGame,
  describeOdds,
  games,
  isLoading,
  lookupEntity,
  lookupQuery,
  lookupResult,
  odds,
  onLookupQueryChange,
  onSend,
  type,
  workflowError,
}) {
  if (isLoading) {
    return (
      <View style={styles.workflowState}>
        <ActivityIndicator color={colors.cyan} />
        <Text style={styles.workflowMuted}>Loading real SWH data...</Text>
      </View>
    );
  }

  if (workflowError) {
    return <Text style={styles.workflowError}>{workflowError}</Text>;
  }

  if (type === 'games') {
    return (
      <View>
        <Text style={styles.workflowMuted}>Tap a current game to ask S.A.L. for a matchup read.</Text>
        {games.length === 0 ? (
          <Text style={styles.workflowEmpty}>No current NBA, NFL, MLB, or NHL games were returned.</Text>
        ) : games.slice(0, 12).map((game) => (
          <SelectableRow
            key={game.id}
            title={game.shortName}
            detail={describeGame(game)}
            onPress={() => onSend(`Give me a concise matchup read using this current game only: ${describeGame(game)}`)}
          />
        ))}
      </View>
    );
  }

  if (type === 'odds') {
    return (
      <View>
        <Text style={styles.workflowMuted}>Tap a supported line to ask S.A.L. for analysis.</Text>
        {odds.length === 0 ? (
          <Text style={styles.workflowEmpty}>No current supported odds were returned.</Text>
        ) : odds.slice(0, 10).map((row) => (
          <SelectableRow
            key={row.id}
            title={row.matchup || row.sport}
            detail={describeOdds(row)}
            onPress={() => onSend(`Analyze this current odds board using only these lines: ${describeOdds(row)}`)}
          />
        ))}
      </View>
    );
  }

  if (type === 'player' || type === 'team') {
    const isTeam = type === 'team';
    const label = isTeam ? 'team' : 'player';
    const entityName = lookupResult?.entity?.name ||
      lookupResult?.entity?.displayName ||
      lookupResult?.name ||
      lookupResult?.displayName ||
      lookupQuery;
    const analysis = lookupResult?.analysis || lookupResult?.summary || lookupResult?.facts?.analysis || '';

    return (
      <View>
        <Text style={styles.workflowMuted}>Enter a {label} name first. S.A.L. will not guess.</Text>
        <View style={styles.lookupShell}>
          <TextInput
            autoCapitalize="words"
            onChangeText={onLookupQueryChange}
            placeholder={isTeam ? 'Search for a team...' : 'Search for a player...'}
            placeholderTextColor={colors.dim}
            style={styles.lookupInput}
            value={lookupQuery}
          />
          <View style={styles.lookupButton}>
            <PrimaryButton variant="secondary" onPress={lookupEntity} disabled={!lookupQuery.trim()}>
              Search
            </PrimaryButton>
          </View>
        </View>
        {lookupResult ? (
          <View style={styles.lookupResult}>
            <Text style={styles.lookupTitle}>{entityName}</Text>
            {analysis ? <Text style={styles.workflowMuted}>{analysis}</Text> : null}
            <PrimaryButton
              variant="secondary"
              onPress={() => onSend(`Give me a concise ${label} read using this verified SWH lookup result only: ${JSON.stringify(lookupResult).slice(0, 3000)}`)}
            >
              Ask S.A.L. About This {isTeam ? 'Team' : 'Player'}
            </PrimaryButton>
          </View>
        ) : null}
      </View>
    );
  }

  return null;
}

function SelectableRow({ title, detail, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.selectableRow, pressed && styles.pressedRow]}
    >
      <Text style={styles.selectableTitle}>{title}</Text>
      <Text style={styles.selectableDetail}>{detail}</Text>
    </Pressable>
  );
}
