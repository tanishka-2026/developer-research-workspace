require('dotenv').config();

async function main() {
  const key = process.env.IBM_CLOUD_API_KEY;
  const url = process.env.WATSONX_URL;

  const tokenResponse = await fetch(
    'https://iam.cloud.ibm.com/identity/token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
        apikey: key
      })
    }
  );

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok) {
    console.error('IAM authentication failed:', tokenData);
    return;
  }

  const response = await fetch(
    `${url}/ml/v1/foundation_model_specs?version=2024-05-01`,
    {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`
      }
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error('watsonx request failed:', data);
    return;
  }

  for (const model of data.resources || []) {
    console.log(model.model_id);
  }
}

main().catch(console.error);