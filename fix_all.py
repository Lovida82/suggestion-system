# -*- coding: utf-8 -*-
import sys
import io
import re

# Windows 콘솔 인코딩 문제 해결
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 파일 읽기
print("leader.html 파일을 읽는 중...")
with open('leader.html', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

print(f"파일 읽기 완료! 파일 크기: {len(content)} 문자\n")

# 깨진 패턴을 찾아서 수정
print("깨진 한글 패턴 수정 중...")

# 깨진 패턴들을 정규식으로 찾아서 제거
# ?로 시작하는 깨진 한글 패턴 찾기
broken_patterns = re.findall(r'\?\�[^\s\'\"]*', content)
print(f"발견된 깨진 패턴: {len(set(broken_patterns))}개")

# 일반적인 깨진 패턴 치환
replacements = [
    ('??', '✅'),
    ('?�수', '함수'),
    ('?�록', '등록'),
    ('?�출', '호출'),
    ('?�어', '없어'),
    ('?�습?�다', '습니다'),
    ('?�니??', '니다'),
    ('발견,', '발견'),
    ('시작...', '시작...'),
    ('?�류:', '오류:'),
    ('?�패?�습?�다', '실패했습니다'),
    ('불러?�는??', '불러오는데'),
    ('목록??', '목록을'),
    ('버튼??', '버튼을'),
    ('찾았?�니??', '찾았습니다!'),
    ('?�체가', '자체가'),
    ('객체??', '객체에'),
    ('검??�?', '검토 중'),
]

total_replacements = 0
for old, new in replacements:
    count = content.count(old)
    if count > 0:
        content = content.replace(old, new)
        total_replacements += count
        print(f"  '{old}' -> '{new}': {count}개")

print(f"\n총 {total_replacements}개 치환 완료!")

# 파일 저장
print("\n파일 저장 중...")
with open('leader.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ leader.html 파일 수정 완료!")
