// JavaScript 추출 스크립트
const fs = require('fs');

try {
    // leader.html 읽기
    const content = fs.readFileSync('leader.html', 'utf-8');

    // <script> 태그 사이의 JavaScript 추출
    const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/g);

    if (!scriptMatch) {
        console.log('스크립트 태그를 찾을 수 없습니다.');
        process.exit(1);
    }

    // 마지막 script 태그 (메인 JavaScript 코드)
    const lastScript = scriptMatch[scriptMatch.length - 1];
    const jsCode = lastScript.replace(/<script>|<\/script>/g, '');

    // JavaScript 파일로 저장
    fs.writeFileSync('leader_extracted.js', jsCode, 'utf-8');
    console.log('JavaScript 코드를 leader_extracted.js에 저장했습니다.');
    console.log('코드 길이:', jsCode.length, '문자');
} catch (error) {
    console.log('오류:', error.message);
    process.exit(1);
}
