import type { PropType, VNodeChild } from 'vue'

import { defineComponent, h, inject, provide } from 'vue'

type AnyRecord = Record<string, any>

const checkboxGroupKey = Symbol('checkboxGroup')

interface CheckboxGroupContext {
  selectedValues: () => Array<number | string>
  toggleValue: (value: number | string, checked: boolean) => void
}

/** mergeClass joins Ant Design marker classes with caller-provided classes for DOM assertions. */
function mergeClass(baseClass: string, incoming?: unknown) {
  return [baseClass, incoming].filter(Boolean)
}

/** renderSlotContent renders either slot content or a simple fallback value. */
function renderSlotContent(slotContent: VNodeChild | undefined, fallback?: VNodeChild) {
  return slotContent ?? fallback
}

/** Button is a native button test double that preserves Ant Design Vue event and class semantics. */
export const Button = defineComponent({
  name: 'Button',
  props: {
    disabled: Boolean,
    htmlType: {
      default: 'button',
      type: String
    },
    loading: Boolean,
    type: String
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        'button',
        {
          ...attrs,
          class: mergeClass('ant-btn', attrs.class),
          disabled: props.disabled || props.loading,
          type: props.htmlType
        },
        slots.default?.()
      )
  }
})

/** Card renders a compact Ant Design card shell for page-level layout assertions. */
export const Card = defineComponent({
  name: 'Card',
  props: {
    bordered: Boolean,
    title: String
  },
  setup(props, { attrs, slots }) {
    return () =>
      h('section', { ...attrs, class: mergeClass('ant-card', attrs.class) }, [
        props.title || slots.title || slots.extra
          ? h('header', { class: 'ant-card-head' }, [
              h('div', { class: 'ant-card-head-title' }, renderSlotContent(slots.title?.(), props.title) as any),
              slots.extra ? h('div', { class: 'ant-card-extra' }, slots.extra()) : null
            ])
          : null,
        h('div', { class: 'ant-card-body' }, slots.default?.())
      ])
  }
})

/** Form is a native form wrapper that allows submit prevention in page specs. */
export const Form = defineComponent({
  name: 'Form',
  setup(_props, { attrs, slots }) {
    return () => h('form', { ...attrs, class: mergeClass('ant-form', attrs.class) }, slots.default?.())
  }
})

/** FormItem renders labels and validation help without depending on browser layout APIs. */
export const FormItem = defineComponent({
  name: 'FormItem',
  props: {
    help: String,
    label: String,
    validateStatus: String
  },
  setup(props, { attrs, slots }) {
    return () =>
      h('label', { ...attrs, class: mergeClass('ant-form-item', attrs.class) }, [
        props.label || slots.label
          ? h('span', { class: 'ant-form-item-label' }, slots.label?.() ?? props.label)
          : null,
        h('div', { class: 'ant-form-item-control' }, slots.default?.()),
        props.help ? h('small', { class: 'ant-form-item-explain' }, props.help) : null
      ])
  }
})

;(Form as any).Item = FormItem

/** Input maps Ant Design Vue v-model:value onto a plain input for deterministic tests. */
export const Input = defineComponent({
  name: 'Input',
  props: {
    disabled: Boolean,
    placeholder: String,
    value: {
      default: '',
      type: String
    }
  },
  emits: ['update:value'],
  setup(props, { attrs, emit }) {
    return () =>
      h('input', {
        ...attrs,
        class: mergeClass('ant-input', attrs.class),
        disabled: props.disabled,
        placeholder: props.placeholder,
        value: props.value,
        onInput: (event: Event) => emit('update:value', (event.target as HTMLInputElement).value)
      })
  }
})

/** SelectOption renders an option node for the native select test double. */
export const SelectOption = defineComponent({
  name: 'SelectOption',
  props: {
    disabled: Boolean,
    value: {
      required: true,
      type: [Number, String] as PropType<number | string>
    }
  },
  setup(props, { slots }) {
    return () =>
      h(
        'option',
        {
          disabled: props.disabled,
          value: props.value
        },
        slots.default?.() ?? `${props.value}`
      )
  }
})

/** Select maps Ant Design Vue v-model:value onto native single and multiple selects. */
export const Select = defineComponent({
  name: 'Select',
  props: {
    disabled: Boolean,
    maxTagCount: {
      default: undefined,
      type: [Number, String] as PropType<number | string | undefined>
    },
    mode: String,
    value: {
      default: '',
      type: [Array, Number, String] as PropType<Array<number | string> | number | string>
    }
  },
  emits: ['update:value'],
  setup(props, { attrs, emit, slots }) {
    return () =>
      h(
        'select',
        {
          ...attrs,
          class: mergeClass('ant-select', attrs.class),
          'data-max-tag-count': props.maxTagCount === undefined ? undefined : `${props.maxTagCount}`,
          'data-mode': props.mode,
          disabled: props.disabled,
          multiple: props.mode === 'multiple',
          value: props.value,
          onChange: (event: Event) => {
            const target = event.target as HTMLSelectElement
            const value =
              props.mode === 'multiple'
                ? Array.from(target.selectedOptions).map((option) => option.value)
                : target.value
            emit('update:value', value)
          }
        },
        slots.default?.()
      )
  }
})

;(Select as any).Option = SelectOption

/** Checkbox maps Ant Design Vue v-model:checked onto a native checkbox. */
export const Checkbox = defineComponent({
  name: 'Checkbox',
  inheritAttrs: false,
  props: {
    checked: Boolean,
    disabled: Boolean,
    value: {
      default: undefined,
      type: [Number, String] as PropType<number | string | undefined>
    }
  },
  emits: ['update:checked'],
  setup(props, { attrs, emit, slots }) {
    const group = inject<CheckboxGroupContext | null>(checkboxGroupKey, null)

    return () =>
      h('label', { class: 'ant-checkbox-wrapper' }, [
        h('input', {
          ...attrs,
          checked: group && props.value !== undefined
            ? group.selectedValues().includes(props.value)
            : props.checked,
          class: mergeClass('ant-checkbox', attrs.class),
          disabled: props.disabled,
          type: 'checkbox',
          value: props.value,
          onChange: (event: Event) => {
            const checked = (event.target as HTMLInputElement).checked
            if (group && props.value !== undefined) {
              group.toggleValue(props.value, checked)
              return
            }
            emit('update:checked', checked)
          }
        }),
        slots.default?.()
      ])
  }
})

/** CheckboxGroup maps Ant Design Vue v-model:value onto a group of native checkbox inputs. */
export const CheckboxGroup = defineComponent({
  name: 'CheckboxGroup',
  props: {
    value: {
      default: () => [],
      type: Array as PropType<Array<number | string>>
    }
  },
  emits: ['update:value'],
  setup(props, { attrs, emit, slots }) {
    provide<CheckboxGroupContext>(checkboxGroupKey, {
      selectedValues: () => props.value ?? [],
      toggleValue: (value, checked) => {
        const current = props.value ?? []
        const next = checked
          ? [...new Set([...current, value])]
          : current.filter((item) => item !== value)
        emit('update:value', next)
      }
    })

    return () => h('div', { ...attrs, class: mergeClass('ant-checkbox-group', attrs.class) }, slots.default?.())
  }
})

;(Checkbox as any).Group = CheckboxGroup

/** Space preserves grouped button and tag layout without Ant Design runtime dependencies. */
export const Space = defineComponent({
  name: 'Space',
  setup(_props, { attrs, slots }) {
    return () => h('span', { ...attrs, class: mergeClass('ant-space', attrs.class) }, slots.default?.())
  }
})

/** Spin keeps loading wrappers visible while exposing the Ant Design class marker. */
export const Spin = defineComponent({
  name: 'Spin',
  props: {
    spinning: Boolean
  },
  setup(_props, { attrs, slots }) {
    return () => h('div', { ...attrs, class: mergeClass('ant-spin-nested-loading', attrs.class) }, slots.default?.())
  }
})

/** Statistic renders compact metric title/value pairs without browser measurement APIs. */
export const Statistic = defineComponent({
  name: 'Statistic',
  props: {
    title: String,
    value: [Number, String]
  },
  setup(props, { attrs, slots }) {
    return () =>
      h('div', { ...attrs, class: mergeClass('ant-statistic', attrs.class) }, [
        h('div', { class: 'ant-statistic-title' }, slots.title?.() ?? props.title),
        h('div', { class: 'ant-statistic-content' }, slots.default?.() ?? props.value)
      ])
  }
})

/** Tag renders compact status and capability markers. */
export const Tag = defineComponent({
  name: 'Tag',
  props: {
    color: String
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        'span',
        {
          ...attrs,
          class: mergeClass('ant-tag', attrs.class),
          'data-color': props.color
        },
        slots.default?.()
      )
  }
})

/** Popconfirm exposes a deterministic confirmation button around its trigger slot. */
export const Popconfirm = defineComponent({
  name: 'Popconfirm',
  emits: ['confirm'],
  setup(_props, { emit, slots }) {
    return () =>
      h('span', { class: 'ant-popconfirm' }, [
        slots.default?.(),
        h(
          'button',
          {
            class: 'ant-popconfirm-confirm',
            type: 'button',
            onClick: () => emit('confirm')
          },
          'confirm'
        )
      ])
  }
})

/** Empty renders the Ant Design empty marker and description text. */
export const Empty = defineComponent({
  name: 'Empty',
  props: {
    description: String
  },
  setup(props, { attrs, slots }) {
    return () =>
      h('div', { ...attrs, class: mergeClass('ant-empty', attrs.class) }, slots.default?.() ?? props.description)
  }
})

/** Dropdown renders the trigger and overlay together so checklist filters stay queryable in tests. */
export const Dropdown = defineComponent({
  name: 'Dropdown',
  setup(_props, { attrs, slots }) {
    return () =>
      h('div', { ...attrs, class: mergeClass('ant-dropdown', attrs.class) }, [
        h('div', { class: 'ant-dropdown-trigger' }, slots.default?.()),
        h('div', { class: 'ant-dropdown-overlay' }, slots.overlay?.())
      ])
  }
})

/** Drawer conditionally renders its contents when the open prop is true. */
export const Drawer = defineComponent({
  name: 'Drawer',
  props: {
    open: Boolean,
    title: String
  },
  emits: ['close', 'update:open'],
  setup(props, { attrs, slots }) {
    return () =>
      props.open
        ? h('aside', { ...attrs, class: mergeClass('ant-drawer', attrs.class) }, [
            h('header', { class: 'ant-drawer-header' }, slots.title?.() ?? props.title),
            h('div', { class: 'ant-drawer-body' }, slots.default?.()),
            slots.footer ? h('footer', { class: 'ant-drawer-footer' }, slots.footer()) : null
          ])
        : null
  }
})

/** Modal conditionally renders its dialog contents when the open prop is true. */
export const Modal = defineComponent({
  name: 'Modal',
  props: {
    footer: {
      default: undefined,
      type: null
    },
    open: Boolean,
    title: String
  },
  emits: ['cancel', 'update:open'],
  setup(props, { attrs, slots }) {
    return () =>
      props.open
        ? h('div', { ...attrs, class: mergeClass('ant-modal', attrs.class) }, [
            h('header', { class: 'ant-modal-header' }, slots.title?.() ?? props.title),
            h('div', { class: 'ant-modal-body' }, slots.default?.()),
            props.footer === null
              ? null
              : h('footer', { class: 'ant-modal-footer' }, slots.footer?.())
          ])
        : null
  }
})

/** Alert renders inline error or info feedback with Ant Design class markers. */
export const Alert = defineComponent({
  name: 'Alert',
  props: {
    message: String,
    type: String
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        'div',
        { ...attrs, class: mergeClass('ant-alert', attrs.class), 'data-type': props.type },
        slots.default?.() ?? props.message
      )
  }
})

/** Descriptions renders read-only facts as a definition list. */
export const Descriptions = defineComponent({
  name: 'Descriptions',
  props: {
    title: String
  },
  setup(props, { attrs, slots }) {
    return () =>
      h('dl', { ...attrs, class: mergeClass('ant-descriptions', attrs.class) }, [
        props.title ? h('dt', { class: 'ant-descriptions-title' }, props.title) : null,
        slots.default?.()
      ])
  }
})

/** DescriptionsItem renders one label-value pair in a test-friendly definition list. */
export const DescriptionsItem = defineComponent({
  name: 'DescriptionsItem',
  props: {
    label: String
  },
  setup(props, { slots }) {
    return () =>
      h('div', { class: 'ant-descriptions-item' }, [
        props.label ? h('dt', { class: 'ant-descriptions-item-label' }, props.label) : null,
        h('dd', { class: 'ant-descriptions-item-content' }, slots.default?.())
      ])
  }
})

/** Table renders computed Ant Design columns and bodyCell slots as a lightweight table. */
export const Table = defineComponent({
  name: 'Table',
  props: {
    columns: {
      default: () => [],
      type: Array as PropType<AnyRecord[]>
    },
    dataSource: {
      default: () => [],
      type: Array as PropType<AnyRecord[]>
    },
    loading: Boolean,
    locale: {
      default: () => ({}),
      type: Object as PropType<AnyRecord>
    },
    pagination: {
      default: false,
      type: [Boolean, Object] as PropType<boolean | AnyRecord>
    },
    rowKey: {
      default: 'key',
      type: [Function, String] as PropType<((record: AnyRecord) => string) | string>
    }
  },
  setup(props, { attrs, slots }) {
    const resolveText = (column: AnyRecord, record: AnyRecord) => {
      if (!column.dataIndex) return undefined
      return record[column.dataIndex]
    }

    return () =>
      h('div', { ...attrs, class: mergeClass('ant-table', attrs.class) }, [
        h(
          'div',
          { class: 'ant-table-header' },
          props.columns.map((column) =>
            h('span', { class: 'ant-table-header-cell', key: column.key ?? column.dataIndex }, column.title)
          )
        ),
        props.dataSource.length
          ? props.dataSource.map((record) =>
              h(
                'div',
                {
                  class: 'ant-table-row',
                  key:
                    typeof props.rowKey === 'function'
                      ? props.rowKey(record)
                      : record[props.rowKey]
                },
                props.columns.map((column) =>
                  h(
                    'div',
                    {
                      class: `ant-table-cell ant-table-cell-${column.key ?? column.dataIndex ?? 'column'}`
                    },
                    slots.bodyCell?.({
                      column,
                      record,
                      text: resolveText(column, record)
                    }) ?? resolveText(column, record)
                  )
                )
              )
            )
          : h('div', { class: 'ant-table-empty' }, props.locale?.emptyText ?? '暂无数据')
      ])
  }
})

/** Tree renders every provided node and calls the Ant Design select handler when a title is clicked. */
export const Tree = defineComponent({
  name: 'Tree',
  props: {
    expandedKeys: {
      default: () => [],
      type: Array as PropType<string[]>
    },
    selectedKeys: {
      default: () => [],
      type: Array as PropType<string[]>
    },
    treeData: {
      default: () => [],
      type: Array as PropType<AnyRecord[]>
    }
  },
  emits: ['select', 'update:expandedKeys'],
  setup(props, { attrs, emit, slots }) {
    const renderNode = (node: AnyRecord, depth = 0): VNodeChild =>
      h('div', { class: 'ant-tree-node', key: node.key, style: { paddingLeft: `${depth * 16}px` } }, [
        h(
          'div',
          {
            class: [
              'ant-tree-title',
              props.selectedKeys.includes(node.key) ? 'ant-tree-title-selected' : ''
            ],
            onClick: () => emit('select', [node.key], { node })
          },
          slots.title?.(node) ?? node.title
        ),
        (node.children ?? []).map((child: AnyRecord) => renderNode(child, depth + 1))
      ])

    return () =>
      h('div', { ...attrs, class: mergeClass('ant-tree', attrs.class) }, props.treeData.map((node) => renderNode(node)))
  }
})

export const message = {
  error: () => undefined,
  success: () => undefined
}
