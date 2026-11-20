import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import BaseDialog from './BaseDialog.vue';

const closeButton = () => document.body.querySelector<HTMLElement>('[data-testid="dialog-close"]');

async function openDialog(closeLabel?: string) {
  const wrapper = mount(BaseDialog, {
    props: { open: true, title: 'Mapa', ...(closeLabel ? { closeLabel } : {}) },
    attachTo: document.body,
  });
  await flushPromises();
  return wrapper;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('BaseDialog', () => {
  it('offers a labelled close button when asked to', async () => {
    await openDialog('Zamknij mapę');

    expect(closeButton()?.getAttribute('aria-label')).toBe('Zamknij mapę');
  });

  it('asks to close when the close button is pressed', async () => {
    const wrapper = await openDialog('Zamknij mapę');

    closeButton()?.click();

    expect(wrapper.emitted('update:open')).toEqual([[false]]);
  });

  it('puts a close button in the screen corner when asked to', async () => {
    const wrapper = mount(BaseDialog, {
      props: { open: true, title: 'Menu', cornerCloseLabel: 'Zamknij menu' },
      attachTo: document.body,
    });
    await flushPromises();

    document.body.querySelector<HTMLElement>('[data-testid="dialog-corner-close"]')?.click();

    expect(wrapper.emitted('update:open')).toEqual([[false]]);
  });

  it('asks to go back when its back button is pressed', async () => {
    const wrapper = mount(BaseDialog, {
      props: { open: true, title: 'Ustawienia', backLabel: 'Wróć do menu' },
      attachTo: document.body,
    });
    await flushPromises();

    document.body.querySelector<HTMLElement>('[aria-label="Wróć do menu"]')?.click();

    expect(wrapper.emitted('back')).toEqual([[]]);
    expect(wrapper.emitted('update:open')).toBeUndefined();
  });

  it('has no back button by default', async () => {
    await openDialog();

    expect(document.body.querySelector('[data-testid="dialog-back"]')).toBeNull();
  });

  it('has no close button by default', async () => {
    await openDialog();

    expect(closeButton()).toBeNull();
  });
});
