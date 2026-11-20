<script setup lang="ts">
import { ref, watch } from 'vue';
import { BaseDialog } from '@/design-system';
import { t } from '@/shared/i18n';
import SettingsSection from '../../molecules/SettingsSection/SettingsSection.vue';
import { useChangePassword } from '../../../composables/useChangePassword';
import ChangePasswordForm, { type PasswordChange } from '../ChangePasswordForm/ChangePasswordForm.vue';

export interface Props {
  open: boolean;
}

defineOptions({ name: 'SettingsDialog' });
const props = defineProps<Props>();
const emit = defineEmits<{ 'update:open': [open: boolean]; back: [] }>();

const password = useChangePassword();
// A new key remounts the form, which clears the typed passwords.
const passwordFormKey = ref(0);
const changePassword = async (change: PasswordChange): Promise<void> => {
  if (await password.submit(change.currentPassword, change.newPassword)) passwordFormKey.value++;
};
watch(
  () => props.open,
  (open) => {
    if (!open) password.reset();
  },
);
</script>

<template>
  <BaseDialog
    :open="open"
    :title="t('settings.title')"
    :escape-closes="false"
    :corner-close-label="t('settings.close')"
    :back-label="t('menu.back')"
    @update:open="emit('update:open', $event)"
    @back="emit('back')"
  >
    <div class="settings">
      <SettingsSection :title="t('settings.password.title')">
        <ChangePasswordForm
          :key="passwordFormKey"
          :pending="password.pending.value"
          :error="password.error.value"
          @submit="changePassword"
        />
        <p v-if="password.changed.value" class="settings__status" role="status" data-testid="settings-password-changed">
          {{ t('settings.password.changed') }}
        </p>
      </SettingsSection>
    </div>
  </BaseDialog>
</template>

<style scoped>
.settings {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-4);
}
.settings__status {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--pine);
}
</style>
