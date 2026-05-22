import {
  createBarcode1d,
  createBarcode2d,
  createBox,
  createLine,
  createProject,
  createText,
} from '../factory';
import type { Project, TextElement } from '../types';

export interface TemplateDef {
  id: string;
  name: string;
  description: string;
  build: () => Project;
}

function bigText(content: string, x: number, y: number, h: number): TextElement {
  const t = createText(x, y);
  t.content = content;
  t.fontHeightDot = h;
  t.fontWidthDot = h;
  return t;
}

function blank(): Project {
  return createProject('빈 라벨');
}

function shipping(): Project {
  const p = createProject('배송 라벨');
  p.label.widthMm = 101.6;
  p.label.heightMm = 152.4;

  const border = createBox(2, 2);
  border.widthMm = 97.6;
  border.heightMm = 148.4;
  border.borderThicknessDot = 3;

  const fromCap = bigText('보내는 사람', 6, 6, 22);
  const from = bigText('{{보내는사람}}', 6, 12, 30);
  const div1 = createLine(6, 26);
  div1.widthMm = 89;

  const toCap = bigText('받는 사람', 6, 30, 26);
  const to = bigText('{{받는사람}}', 6, 37, 46);
  const addr = createText(6, 50);
  addr.content = '{{주소}}';
  addr.fontHeightDot = 30;
  addr.fontWidthDot = 30;
  addr.widthMm = 89;
  addr.heightMm = 24;
  addr.multiline = true;
  addr.maxLines = 3;

  const div2 = createLine(6, 110);
  div2.widthMm = 89;

  const trkCap = bigText('운송장 번호', 6, 114, 22);
  const barcode = createBarcode1d(6, 120);
  barcode.symbology = 'CODE128';
  barcode.data = '{{운송장번호}}';
  barcode.widthMm = 89;
  barcode.heightMm = 26;
  barcode.barHeightDot = 120;

  p.variables = [
    { name: '보내는사람', sampleValue: '서울물류센터' },
    { name: '받는사람', sampleValue: '홍길동' },
    { name: '주소', sampleValue: '서울특별시 강남구 테헤란로 123, 4층' },
    { name: '운송장번호', sampleValue: '1234567890123' },
  ];
  p.label.elements = [border, fromCap, from, div1, toCap, to, addr, div2, trkCap, barcode];
  return p;
}

function priceTag(): Project {
  const p = createProject('가격표');
  p.label.widthMm = 50;
  p.label.heightMm = 30;

  const name = bigText('{{상품명}}', 3, 2, 28);
  name.widthMm = 44;
  const price = bigText('{{가격}} 원', 3, 9, 56);
  price.align = 'C';
  price.widthMm = 44;
  const barcode = createBarcode1d(7, 20);
  barcode.symbology = 'EAN13';
  barcode.data = '8801234567890';
  barcode.widthMm = 36;
  barcode.heightMm = 9;
  barcode.barHeightDot = 50;

  p.variables = [
    { name: '상품명', sampleValue: '유기농 사과' },
    { name: '가격', sampleValue: '12,900' },
  ];
  p.label.elements = [name, price, barcode];
  return p;
}

function assetTag(): Project {
  const p = createProject('자산 태그');
  p.label.widthMm = 50;
  p.label.heightMm = 25;

  const border = createBox(1.5, 1.5);
  border.widthMm = 47;
  border.heightMm = 22;
  border.borderThicknessDot = 2;

  const qr = createBarcode2d(4, 4);
  qr.symbology = 'QR';
  qr.data = '{{자산번호}}';
  qr.widthMm = 17;
  qr.heightMm = 17;
  qr.magnification = 4;

  const cap = bigText('자산번호', 24, 5, 20);
  const id = bigText('{{자산번호}}', 24, 10, 28);
  const dept = createText(24, 16);
  dept.content = '{{부서}}';
  dept.fontHeightDot = 22;
  dept.fontWidthDot = 22;

  p.variables = [
    { name: '자산번호', sampleValue: 'AST-2026-0042' },
    { name: '부서', sampleValue: 'R&D 1팀' },
  ];
  p.label.elements = [border, qr, cap, id, dept];
  return p;
}

function addressLabel(): Project {
  const p = createProject('주소 라벨');
  p.label.widthMm = 70;
  p.label.heightMm = 40;

  const name = bigText('{{이름}}', 4, 4, 34);
  const addr = createText(4, 13);
  addr.content = '{{주소}}';
  addr.fontHeightDot = 26;
  addr.fontWidthDot = 26;
  addr.widthMm = 62;
  addr.heightMm = 18;
  addr.multiline = true;
  addr.maxLines = 3;
  const zip = bigText('[ {{우편번호}} ]', 4, 32, 26);

  p.variables = [
    { name: '이름', sampleValue: '김영희' },
    { name: '주소', sampleValue: '부산광역시 해운대구 해운대로 99' },
    { name: '우편번호', sampleValue: '48095' },
  ];
  p.label.elements = [name, addr, zip];
  return p;
}

export const templates: TemplateDef[] = [
  { id: 'blank', name: '빈 라벨', description: '101.6 × 152.4 mm 빈 캔버스', build: blank },
  { id: 'shipping', name: '배송 라벨', description: '보내는/받는 사람 + 운송장 바코드', build: shipping },
  { id: 'price', name: '가격표', description: '상품명 + 가격 + EAN-13 바코드', build: priceTag },
  { id: 'asset', name: '자산 태그', description: 'QR 코드 + 자산번호 + 테두리', build: assetTag },
  { id: 'address', name: '주소 라벨', description: '이름 + 주소(여러 줄) + 우편번호', build: addressLabel },
];
