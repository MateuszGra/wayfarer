<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { BaseButton, BaseDialog } from '@/design-system';
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

const router = useRouter();
const changePlan = (): void => void router.push({ path: '/start', query: { change: null } });
// The password form opens only when asked for, so the settings stay a short list of choices.
const passwordOpen = ref(false);
const password = useChangePassword();
// A new key remounts the form, which clears the typed passwords.
const passwordFormKey = ref(0);
const changePassword = async (change: PasswordChange): Promise<void> => {
  if (await password.submit(change.currentPassword, change.newPassword)) {
    passwordFormKey.value++;
    passwordOpen.value = false;
  }
};
watch(
  () => props.open,
  (open) => {
    if (!open) {
      password.reset();
      passwordOpen.value = false;
    }
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
        <BaseButton
          v-if="!passwordOpen"
          variant="paper"
          block
          aria-controls="settings-password-form"
          :aria-expanded="false"
          data-testid="settings-password-open"
          @click="passwordOpen = true"
        >
          {{ t('settings.password.open') }}
        </BaseButton>
        <template v-else>
          <ChangePasswordForm
            id="settings-password-form"
            :key="passwordFormKey"
            :pending="password.pending.value"
            :error="password.error.value"
            @submit="changePassword"
          />
          <BaseButton variant="link" data-testid="settings-password-cancel" @click="passwordOpen = false">
            {{ t('settings.password.cancel') }}
          </BaseButton>
        </template>
        <p v-if="password.changed.value" class="settings__status" role="status" data-testid="settings-password-changed">
          {{ t('settings.password.changed') }}
        </p>
      </SettingsSection>
      <SettingsSection :title="t('settings.journey.title')">
        <BaseButton variant="paper" block data-testid="settings-change-plan" @click="changePlan">
          {{ t('settings.journey.change') }}
        </BaseButton>
        <p class="settings__note">{{ t('settings.journey.warning') }}</p>
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
.settings__note {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--ink-dim);
}
.settings__status {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--pine);
}
</style>
