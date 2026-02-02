// Netlify Function for OpenAI API
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // POST 요청만 허용
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // 요청 본문 파싱
    const { customPrompt } = JSON.parse(event.body);

    // OpenAI API 키는 환경변수에서 가져옴
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'OpenAI API key not configured' }),
      };
    }

    if (!customPrompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Custom prompt is required' }),
      };
    }

    // OpenAI API 호출
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',  // GPT-4보다 빠른 응답 (10초 타임아웃 방지)
        messages: [
          {
            role: 'system',
            content: '당신은 제안제도 시스템의 유형효과 검증 전문가입니다. 제안서의 유형효과(금액)를 검증하는데 필요한 실무적이고 구체적인 기준을 제시합니다.',
          },
          {
            role: 'user',
            content: customPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,  // 토큰 수를 줄여서 응답 시간 단축
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'OpenAI API request failed');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        analysis: aiResponse,
      }),
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
    };
  }
};
