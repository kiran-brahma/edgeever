import { ApiRequestError } from "@edgeever/client";
import type { AuthUser } from "@edgeever/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Plus, UserRound } from "../components/icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { Pressable, Text, TextInput } from "../components/LocalizedText";
import { resolveMobileThemeStyles, useMobileTheme, type MobileResolvedTheme } from "../lib/mobile-theme";
import { useSession } from "../lib/session";

export type AccountSecuritySection = "password" | "users";

export const AccountSecurityPanel = ({
  active,
  currentUser,
  section,
}: {
  active: boolean;
  currentUser: AuthUser | null;
  section: AccountSecuritySection;
}) => {
  const { resolvedTheme } = useMobileTheme();
  refreshAccountSecurityThemeStyles(resolvedTheme);
  const { client } = useSession();
  const queryClient = useQueryClient();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [memberPassword, setMemberPassword] = useState("");
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");

  const usersQuery = useQuery({
    queryKey: ["mobile", "users"],
    queryFn: async () => {
      if (!client) throw new Error("Client is not ready");
      return client.listUsers();
    },
    enabled: Boolean(client && active && currentUser?.role === "owner" && section === "users"),
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      if (!client) throw new Error("Client is not ready");
      if (newPassword.length < 8) throw new Error("New password must be at least 8 characters");
      if (newPassword !== confirmPassword) throw new Error("New passwords do not match");
      return client.changePassword({ currentPassword, newPassword, confirmPassword });
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async () => {
      if (!client) throw new Error("Client is not ready");
      if (memberPassword.length < 8) throw new Error("Password must be at least 8 characters");
      return client.createUser({ username: username.trim(), displayName: displayName.trim() || null, password: memberPassword });
    },
    onSuccess: async () => {
      setCreateOpen(false);
      setUsername("");
      setDisplayName("");
      setMemberPassword("");
      await queryClient.invalidateQueries({ queryKey: ["mobile", "users"] });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, input }: { userId: string; input: { password?: string; isDisabled?: boolean } }) => {
      if (!client) throw new Error("Client is not ready");
      return client.updateUser(userId, input);
    },
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["mobile", "users"] }),
  });

  useEffect(() => {
    if (!active) {
      passwordMutation.reset();
      createUserMutation.reset();
      updateUserMutation.reset();
    }
  }, [active]);

  const errorMessage = (error: unknown) => {
    if (error instanceof ApiRequestError && error.code === "invalid_current_password") return "Current password is incorrect";
    if (error instanceof ApiRequestError && error.code === "username_exists") return "This username already exists";
    return error instanceof Error ? error.message : "Operation failed, please try again later";
  };
  const resetUser = usersQuery.data?.users.find((user) => user.id === resetUserId) ?? null;
  const closeCreateDialog = () => {
    setCreateOpen(false);
    setUsername("");
    setDisplayName("");
    setMemberPassword("");
    createUserMutation.reset();
  };
  const closeResetDialog = () => {
    setResetUserId(null);
    setResetPasswordValue("");
    updateUserMutation.reset();
  };

  return section === "password" ? (
    <View style={styles.content}>
      <View style={styles.hero}>
        <KeyRound color="#15803d" size={22} />
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>Change password</Text>
          <Text style={styles.help}>Current device stays logged in; other devices will be signed out.</Text>
        </View>
      </View>
      <Field label="CurrentPassword" onChangeText={setCurrentPassword} value={currentPassword} />
      <Field label="New password" onChangeText={setNewPassword} value={newPassword} />
      <Field label="Confirm new password" onChangeText={setConfirmPassword} value={confirmPassword} />
      {passwordMutation.error ? <Text style={styles.error}>{errorMessage(passwordMutation.error)}</Text> : null}
      {passwordMutation.isSuccess ? <Text accessibilityLiveRegion="polite" style={styles.success}>Password changed successfully.</Text> : null}
      <PrimaryButton
        disabled={passwordMutation.isPending}
        label={passwordMutation.isPending ? "Changing..." : "Change password"}
        onPress={() => passwordMutation.mutate()}
      />
    </View>
  ) : (
    <View style={styles.content}>
      <View style={styles.sectionHeader}>
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>Members</Text>
          <Text style={styles.help}>Create independent personal note spaces for family or team members. Public registration is disabled.</Text>
        </View>
        <Pressable onPress={() => setCreateOpen(true)} style={styles.addButton}>
          <Plus color="#ffffff" size={16} />
          <Text style={styles.addButtonText}>Add member</Text>
        </Pressable>
      </View>

      {usersQuery.isLoading ? <ActivityIndicator color="#15803d" /> : null}
      {usersQuery.error ? <Text style={styles.error}>{errorMessage(usersQuery.error)}</Text> : null}
      {usersQuery.data?.users.map((user) => (
        <View key={user.id} style={styles.userBlock}>
          <View style={styles.userCard}>
            <View style={styles.userIcon}><UserRound color="#15803d" size={18} /></View>
            <View style={styles.flex}>
              <Text style={styles.userName}>{user.displayName || user.username}</Text>
              <Text style={styles.help}>@{user.username} · {user.role === "owner" ? "Instance admin" : user.isDisabled ? "Disabled" : "Enabled"}</Text>
              <Pressable onPress={() => { setResetUserId(user.id); setResetPasswordValue(""); }}><Text style={styles.link}>ResetPassword</Text></Pressable>
            </View>
            {user.role !== "owner" ? (
              <Switch
                disabled={updateUserMutation.isPending}
                onValueChange={(enabled) => updateUserMutation.mutate({ userId: user.id, input: { isDisabled: !enabled } })}
                value={!user.isDisabled}
              />
            ) : null}
          </View>
        </View>
      ))}
      <Modal animationType="fade" onRequestClose={closeCreateDialog} transparent visible={createOpen}>
        <Pressable onPress={closeCreateDialog} style={styles.dialogBackdrop}>
          <Pressable style={styles.dialogCard}>
            <Text style={styles.cardTitle}>Add new member</Text>
            <Text style={styles.help}>New accounts get fully independent notes, attachments, trash, and MCP tokens.</Text>
            <Field label="Username" onChangeText={setUsername} placeholder="e.g. xiaoming" secure={false} value={username} />
            <Field label="Display name" onChangeText={setDisplayName} placeholder="Optional, e.g. Xiaoming" secure={false} value={displayName} />
            <Field help="Members can change their password in account settings after first login." label="Initial password" onChangeText={setMemberPassword} placeholder="Enter at least 8 characters" value={memberPassword} />
            {createUserMutation.error ? <Text style={styles.error}>{errorMessage(createUserMutation.error)}</Text> : null}
            <View style={styles.dialogActions}>
              <Pressable onPress={closeCreateDialog} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable>
              <PrimaryButton
                disabled={createUserMutation.isPending || !username.trim() || memberPassword.length < 8}
                label={createUserMutation.isPending ? "Creating..." : "Add member"}
                onPress={() => createUserMutation.mutate()}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal animationType="fade" onRequestClose={closeResetDialog} transparent visible={Boolean(resetUser)}>
        <Pressable onPress={closeResetDialog} style={styles.dialogBackdrop}>
          <Pressable style={styles.dialogCard}>
            <Text style={styles.cardTitle}>{`Reset ${resetUser?.username ?? ""}'s password`}</Text>
            <Text style={styles.help}>After reset, this account's sessions on other devices will expire.</Text>
            <Field label="New password (at least 8 characters)" onChangeText={setResetPasswordValue} placeholder="Enter at least 8 characters" value={resetPasswordValue} />
            <View style={styles.dialogActions}>
              <Pressable onPress={closeResetDialog} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable>
              <PrimaryButton
                disabled={updateUserMutation.isPending || resetPasswordValue.length < 8 || !resetUser}
                label={updateUserMutation.isPending ? "Resetting..." : "ResetPassword"}
                onPress={() => resetUser && updateUserMutation.mutate(
                  { userId: resetUser.id, input: { password: resetPasswordValue } },
                  { onSuccess: closeResetDialog },
                )}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const Field = ({ help, label, onChangeText, placeholder, secure = true, value }: {
  help?: string;
  label: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secure?: boolean;
  value: string;
}) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      autoCapitalize="none"
      autoCorrect={false}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#94a3b8"
      secureTextEntry={secure}
      style={styles.input}
      value={value}
    />
    {help ? <Text style={styles.help}>{help}</Text> : null}
  </View>
);

const PrimaryButton = ({ disabled, label, onPress }: { disabled: boolean; label: string; onPress: () => void }) => (
  <Pressable disabled={disabled} onPress={onPress} style={[styles.primaryButton, disabled && styles.disabled]}>
    <Text style={styles.primaryButtonText}>{label}</Text>
  </Pressable>
);

const baseAccountSecurityStyles = StyleSheet.create({
  content: { gap: 14, padding: 16, paddingBottom: 40 },
  hero: { alignItems: "flex-start", backgroundColor: "transparent", flexDirection: "row", gap: 10 },
  sectionHeader: { alignItems: "center", flexDirection: "row", gap: 12 },
  flex: { flex: 1 },
  cardTitle: { color: "#17211a", fontSize: 16, fontWeight: "800" },
  help: { color: "#64748b", fontSize: 12, lineHeight: 18, marginTop: 3 },
  field: { gap: 7 },
  label: { color: "#334155", fontSize: 13, fontWeight: "700" },
  input: { backgroundColor: "#ffffff", borderColor: "#cad8cc", borderRadius: 10, borderWidth: 1, color: "#17211a", minHeight: 48, paddingHorizontal: 13 },
  primaryButton: { alignItems: "center", backgroundColor: "#15803d", borderRadius: 10, minHeight: 48, justifyContent: "center", paddingHorizontal: 16 },
  primaryButtonText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  disabled: { opacity: 0.45 },
  error: { color: "#be123c", fontSize: 13, lineHeight: 19 },
  success: { color: "#15803d", fontSize: 13, fontWeight: "700", lineHeight: 19 },
  addButton: { alignItems: "center", backgroundColor: "#15803d", borderRadius: 9, flexDirection: "row", gap: 6, paddingHorizontal: 12, paddingVertical: 9 },
  addButtonText: { color: "#ffffff", fontSize: 13, fontWeight: "800" },
  userCard: { alignItems: "center", backgroundColor: "#ffffff", borderColor: "#dce7dd", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 12, padding: 14 },
  userBlock: { gap: 8 },
  dialogBackdrop: { alignItems: "center", backgroundColor: "rgba(15, 23, 42, 0.48)", flex: 1, justifyContent: "center", padding: 20 },
  dialogCard: { backgroundColor: "#ffffff", borderRadius: 14, gap: 14, maxWidth: 520, padding: 18, width: "100%" },
  dialogActions: { alignItems: "center", flexDirection: "row", gap: 10, justifyContent: "flex-end" },
  cancelButton: { alignItems: "center", borderColor: "#dce7dd", borderRadius: 10, borderWidth: 1, justifyContent: "center", minHeight: 48, paddingHorizontal: 16 },
  cancelText: { color: "#64748b", fontSize: 13, fontWeight: "700" },
  userIcon: { alignItems: "center", backgroundColor: "#ecfdf3", borderRadius: 20, height: 40, justifyContent: "center", width: 40 },
  userName: { color: "#17211a", fontSize: 14, fontWeight: "800" },
  link: { color: "#15803d", fontSize: 12, fontWeight: "700", marginTop: 6 },
});

let styles = baseAccountSecurityStyles;
let accountSecurityStylesTheme: MobileResolvedTheme = "light";

const refreshAccountSecurityThemeStyles = (theme: MobileResolvedTheme) => {
  if (accountSecurityStylesTheme !== theme) {
    styles = resolveMobileThemeStyles(baseAccountSecurityStyles, theme);
    accountSecurityStylesTheme = theme;
  }
};
