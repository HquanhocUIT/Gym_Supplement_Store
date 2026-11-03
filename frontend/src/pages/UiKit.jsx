import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Select, Textarea, FormField, Modal, ConfirmDialog, DataTable } from '../components/ui';

export default function UiKit() {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const demoData = [
    { id: 1, name: 'Whey Protein', price: 1200000, stock: 50 },
    { id: 2, name: 'Creatine', price: 500000, stock: 30 },
    { id: 3, name: 'Pre-workout', price: 800000, stock: 20 },
    { id: 4, name: 'BCAA', price: 600000, stock: 15 },
    { id: 5, name: 'Multivitamin', price: 350000, stock: 100 },
    { id: 6, name: 'Fish Oil', price: 400000, stock: 45 },
    { id: 7, name: 'Glutamine', price: 450000, stock: 25 },
    { id: 8, name: 'Casein', price: 1100000, stock: 10 },
    { id: 9, name: 'Mass Gainer', price: 1500000, stock: 5 },
    { id: 10, name: 'Pre-workout Extreme', price: 900000, stock: 0 },
    { id: 11, name: 'L-Carnitine', price: 550000, stock: 12 },
  ];

  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Tên sản phẩm', sortable: true },
    { key: 'price', label: 'Giá', sortable: true, render: (r) => <span className="font-medium text-gray-900">{r.price.toLocaleString('vi-VN')}đ</span> },
    { key: 'stock', label: 'Tồn kho', sortable: true, render: (r) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {r.stock} cái
      </span>
    )},
  ];

  return (
    <div className="p-8 space-y-12 max-w-6xl mx-auto text-left">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">UI Kit Demo</h1>
        <p className="text-gray-500">Thư viện component dùng chung của nhóm 28.</p>
        {/* Liên kết sang trang minh chứng các component của Task 6. */}
        <Link className="mt-4 inline-flex min-h-11 items-center font-semibold text-brand-700 underline underline-offset-4" to="/ui-kit/common">Xem Common components →</Link>
      </div>

      {/* Button */}
      <section>
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Button</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      {/* Form */}
      <section>
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Form Elements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
          <FormField label="Tên sản phẩm" required hint="Nhập tên hiển thị">
            <Input placeholder="VD: Whey Protein..." />
          </FormField>
          <FormField label="Email" required error="Email không hợp lệ">
            <Input placeholder="email@example.com" error />
          </FormField>
          <FormField label="Danh mục">
            <Select>
              <option value="">Chọn danh mục</option>
              <option>Whey Protein</option>
              <option>Creatine</option>
            </Select>
          </FormField>
          <FormField label="Ghi chú">
            <Textarea placeholder="Nhập ghi chú..." />
          </FormField>
        </div>
      </section>

      {/* Modal & Confirm */}
      <section>
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Overlays</h2>
        <div className="flex gap-3">
          <Button onClick={() => setModalOpen(true)}>Mở Modal</Button>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>Mở Confirm Xóa</Button>
        </div>
        <Modal 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
          title="Chi tiết sản phẩm"
          footer={
            <>
              <Button variant="outline" onClick={() => setModalOpen(false)}>Đóng</Button>
              <Button onClick={() => setModalOpen(false)}>Lưu lại</Button>
            </>
          }
        >
          <p>Đây là nội dung bên trong Modal. Bạn có thể đặt form hoặc thông tin chi tiết ở đây.</p>
        </Modal>
        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => { alert('Đã xác nhận xóa!'); setConfirmOpen(false); }}
          message="Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác."
        />
      </section>

      {/* DataTable */}
      <section>
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">DataTable (Phân trang & Sắp xếp)</h2>
        <DataTable columns={columns} data={demoData} pageSize={5} />
      </section>
    </div>
  );
}
