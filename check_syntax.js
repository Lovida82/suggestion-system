// JavaScript 구문 검사 스크립트
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

    console.log('JavaScript 코드 길이:', jsCode.length);
    console.log('구문 검사 시작...\n');

    // 구문 검사
    try {
        new Function(jsCode);
        console.log('✅ 구문 오류 없음!');
    } catch (error) {
        console.log('❌ 구문 오류 발견!');
        console.log('오류 메시지:', error.message);
        console.log('오류 위치:', error.stack);

        // 오류 위치 찾기
        if (error.message.includes('line')) {
            const lineMatch = error.message.match(/line (\d+)/);
            if (lineMatch) {
                const errorLine = parseInt(lineMatch[1]);
                const lines = jsCode.split('\n');
                console.log('\n오류 근처 코드:');
                for (let i = Math.max(0, errorLine - 3); i < Math.min(lines.length, errorLine + 3); i++) {
                    const prefix = i === errorLine - 1 ? '>>> ' : '    ';
                    console.log(`${prefix}${i + 1}: ${lines[i]}`);
                }
            }
        }
    }
} catch (error) {
    console.log('파일 읽기 오류:', error.message);
    process.exit(1);
}
