import { useState, useEffect } from 'react';
import { Input, Textarea, Button } from '../common';
import type { Customer } from '../../types';

interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function CustomerForm({ customer, onSubmit, onCancel }: CustomerFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    website: '',
    address: '',
    position: '',
    contactPerson: '',
    category: '',
    referralSource: '',
    memo: '',
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        company: customer.company || '',
        website: customer.website || '',
        address: customer.address || '',
        position: customer.position || '',
        contactPerson: customer.contactPerson || '',
        category: customer.category || '',
        referralSource: customer.referralSource || '',
        memo: customer.memo || '',
      });
    }
  }, [customer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="顧客名 *"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
        placeholder="山田 太郎"
      />
      <Input
        label="会社名"
        value={formData.company}
        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
        placeholder="株式会社〇〇"
      />
      <Input
        label="メールアドレス"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="example@example.com"
      />
      <Input
        label="電話番号"
        type="tel"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        placeholder="03-1234-5678"
      />
      <Input
        label="WebサイトURL"
        type="url"
        value={formData.website}
        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
        placeholder="https://example.com"
      />
      <Input
        label="住所"
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        placeholder="東京都〇〇区..."
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="担当者名"
          value={formData.contactPerson}
          onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
          placeholder="田中さん"
        />
        <Input
          label="役職"
          value={formData.position}
          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
          placeholder="部長"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="種別"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          placeholder="法人 / 個人"
        />
        <Input
          label="紹介元"
          value={formData.referralSource}
          onChange={(e) => setFormData({ ...formData, referralSource: e.target.value })}
          placeholder="〇〇さん紹介"
        />
      </div>
      <Textarea
        label="メモ"
        value={formData.memo}
        onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
        placeholder="備考やメモ"
      />
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          キャンセル
        </Button>
        <Button type="submit">{customer ? '更新' : '作成'}</Button>
      </div>
    </form>
  );
}
