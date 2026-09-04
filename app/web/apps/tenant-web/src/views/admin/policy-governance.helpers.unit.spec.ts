import { describe, expect, it } from 'vitest';

import {
  buildPolicyTablePagination,
  formatPolicyConditionAst,
  getPolicyEffectPresentation,
  getPolicySubjectTypeLabel,
} from './policy-governance.helpers';

describe('policy governance helpers', () => {
  it('builds explicit admin pagination settings', () => {
    const pagination = buildPolicyTablePagination({
      current: 2,
      pageSize: 50,
      total: 120,
    });

    expect(pagination.current).toBe(2);
    expect(pagination.pageSize).toBe(50);
    expect(pagination.showQuickJumper).toBe(true);
    expect(pagination.showSizeChanger).toBe(true);
  });

  it('maps policy effect and subject type facts into stable labels', () => {
    expect(getPolicyEffectPresentation('ALLOW')).toEqual({
      color: 'green',
      label: '允许',
    });
    expect(getPolicyEffectPresentation(2)).toEqual({
      color: 'red',
      label: '拒绝',
    });
    expect(getPolicySubjectTypeLabel('ROLE')).toBe('角色');
    expect(getPolicySubjectTypeLabel(2)).toBe('账号');
    expect(getPolicySubjectTypeLabel('ANY')).toBe('任意主体');
  });

  it('formats readable condition ast json and falls back to raw text for invalid payloads', () => {
    expect(
      formatPolicyConditionAst('{"all":[{"fact":"tenantId","op":"eq","value":"tenant-1"}]}'),
    ).toContain('"tenantId"');
    expect(formatPolicyConditionAst('not-json')).toBe('not-json');
    expect(formatPolicyConditionAst('')).toBe('');
  });
});
