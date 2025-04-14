const { google } = require("googleapis");
const axios = require("axios");

const SPREADSHEET_ID = "1tITi6GX71wZ7ZjLtQQ8C1FXsKQxc7Y1DbRlINJmHRcM";
const RANGE = "설문지 응답 시트1!A1:Z";
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/여기에_웹훅_URL";

// 서비스 계정 정보 직접 입력 (절대 외부 노출 금지!)
const serviceAccount = {
  client_email: "registeralert@test-456802.iam.gserviceaccount.com",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDd8atfnQlVvYvO\nyR7YVVfo1Tz/znzJabG7hZS5zLGUsIsRigjUypSjrOojSvBCCoOASr1Bx0dtmksj\nD+0nz0IgSW6UIM8h+BlXXHLSNjIrshQCIF0ICVmdRI/XY0V6viIRFiAcWw9uLTDd\nUMBfBWtWtP4r1EL4JCVgSHm/Twb0guSJgiOAUfXiIM9EBueIEoBPA2FRpIdhnOPt\nWznhhok739Pt1l4aKPJ++ipg1P2pdC++q8tit43VjIXV/GiXv7/zTl+9tA/na7dH\nDPB1m7/rFQUnzREiQ7iGk1I6ZI0Frzh2l7uYI8NxFoAoY4+BV5I3e5/ZUlaKYX9/\nfE3niCsPAgMBAAECggEAJMOGiiuBONkmzVA7p5psxJjR5mO7VZey76eJwm8u4+eM\nhGa+M2qtIsxJP82xgkGrP7c2+1bkX4+P2P/R3mbIAtYhwYVfxODhExCxb7MM2M0X\niwn2WcGcEl923jbySDSHgGy5pp4fg7YWTTVg8Dx9vRqfrFNC6/H82PftvCv92xwm\neyrquP/+qqjVAVzJWdDbj6Xi4t9PenqHGpd5NJUeTlE71ZGiTUFsstx2df0uokeA\nt3laph+a39Xqk5eutgabvSZKtk8QJg57+xokmW9QHNqGPtkB3vHk2Ls8eA+hQaG2\nUiT3l7TFHyWhDdIUXUAadOXPAsIlBL/tu6F8DNRsUQKBgQD0YgDZ2Ch1GtZSUjaZ\nOK1RxS5qYuhUVLOkZvBDPPYZRHQ+U9A+OPTJUqQW/Cabvnb8xAnDm9BbLg/ohyQ7\n3BMFe0hAsM3RaRUPzE/gg8/ayaiFFQG9u3l52Pg+WEasT5ryiKxhtXkedwvbg6/j\nKXhuwxsJrQWMvAZO6AXLPyT18QKBgQDofplS9z4R/tV/s/ettDTXjoyrfABMnjnV\nQj62i9O/EbaIFwslhbR6ce0dDBfCPhqSAqEhoYkkVmriD3xgHemxYDurwrRfoYb5\n8mXA+aGxve3UDx4Mq0fw0eVtJCW3FU2fC17BO4KiVmfRYxcY+QzNvhx+DyAoO+cZ\n2n0yCzow/wKBgQCSVKSBzKbdCAbRIB1FPeS6E8GpPjQzWsx+Yoz3FeeeVZjtQS5u\nM5iPfAZ5JN7RXwjMbW4TTJdEIZ6w80rE9RAGtj0bT0LOY4eTABnMK+En9pwLo/p4\n62rfhQWP/zfCMaBsHV5q20j87veQp5eIA+rzF6x27L1n+aYlVVUy0EqHYQKBgQCo\nIp35TQpbc0KtNtZgjZlFZja+8U86GZdTbbPyyg5Y+JNbueZ6vUX24xsKTauE8uq+\nOx6SNsL6P3DOiUp2LEvL1f9xSL6vBh6Z9b22oBFafDNZj5E4skm1k+XqVyDbVZGr\n+koNTl87zWcJGzMiAUJMLDdoxsGHt0J7BPJTVaFAuwKBgQCSMwpDjY7Dmehm8qNV\nP7UF4RtZFv0ghelkZhazsd/+Psv2eYGPQ/hYZvAvOCBIawmk2kNau3legAFO+HQs\nx+jTI5f1MXJ5kHALg8OYZ/QnG3lsmYY0w0fNZGiJcuYCkDLP/ooDQmTpS3uX7gTR\n0vlPN+gDzUejkKzaxEz/7P3asQ==\n-----END PRIVATE KEY-----\n",
};
const auth = new google.auth.JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

let previousRowCount = 0;

async function checkForNewRows() {
  const client = await auth.authorize().then(() => auth);
  const sheets = google.sheets({ version: "v4", auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
  });

  const rows = res.data.values;
  if (!rows || rows.length < 2) {
    console.log("데이터 없음 또는 헤더만 있음.");
    return;
  }

  const currentRowCount = rows.length;

  if (currentRowCount > previousRowCount) {
    const newRows = rows.slice(previousRowCount);

    for (let i = 0; i < newRows.length; i++) {
      const rowData = newRows[i];

      const joinTime = rowData[0] || "없음";
      const name = rowData[2] || "이름 없음";
      const studentId = rowData[3] || "학번 없음";
      const birth = rowData[4] || "생년월일 없음";
      const contact = rowData[5] || "연락처 없음";
      const why = rowData[8] || "지원 동기 없음";
      const what = rowData[9] || "얻어가고 싶은 것 없음";
      const pm = rowData[10] || "기획 경험 없음";
      const dev = rowData[11] || "개발 경험 없음";
      const design = rowData[12] || "디자인 경험 없음";
      const totalApplicants = currentRowCount - 2;

      const message = `${name}님이 스터디를 신청했어요🎉🎉.\n정보는 다음과 같습니다:\n\n신청시간: "${joinTime}", \n학번: "${studentId}", \n연락처: "${contact}", \n\n지원동기: "${why}"\n얻어가고 싶은 것: "${what}"\n\n기획경험: "${pm}"\n개발경험: "${dev}"\n디자인경험: "${design}"\n지금까지 총 ${totalApplicants}명이 신청했어요!`;

      const embed = {
        content: "",
        embeds: [
          {
            title: "알람 등장!",
            color: 33023,
            fields: [
              {
                name: "신규 신청 알림",
                value: message,
                inline: false,
              },
            ],
          },
        ],
      };

      await axios.post(DISCORD_WEBHOOK_URL, embed);
      console.log("✅ 디스코드 전송 완료");
    }

    previousRowCount = currentRowCount;
  } else {
    console.log("변화 없음");
  }
}

checkForNewRows().then(() => {
  console.log("✅ 최초 체크 완료, 주기적 확인 시작");
});
setInterval(checkForNewRows, 30 * 1000);
