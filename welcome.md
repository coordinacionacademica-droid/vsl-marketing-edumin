> For the complete documentation index, see [llms.txt](https://docs.dlocalgo.com/integration-api/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://docs.dlocalgo.com/integration-api/welcome-to-dlocal-go-api.md).

# Welcome to dLocal Go API

With dLocal Go API, you can get up and running with keys and integration tools. Manage a powerful payment solution with a range of capabilities, including: payments, refunds and notifications.

**Not sure where to start?** See our guide on [Getting started](#getting-started) with dLocal Go.&#x20;

You can explore a sample integration project by visiting the repository at <https://bitbucket.org/directopago/integration-sample/>. Feel free to use and contribute to the project to enhance your understanding of the integration process.

## <mark style="color:blue;">**Getting started**</mark>

Every call to the dLocal Go API must include an API secret key. We offer two environments for developers to integrate our payment processing services: Sandbox and Live. Upon creating a dLocal Go account or a Testing account, we generate two distinct pairs of API keys—one for client-side use (publishable key) and one for server-side use (secret key). Each environment has its own unique set of keys. To process real transactions using live-mode keys, you need to have an activated live account.

<table data-card-size="large" data-view="cards"><thead><tr><th></th><th></th><th></th><th data-hidden data-card-cover data-type="files"></th></tr></thead><tbody><tr><td><mark style="color:blue;"><strong>Testing environment</strong></mark></td><td>URL: <a href="https://api-sbx.dlocalgo.com/">https://api-sbx.dlocalgo.com</a></td><td>The Testing environment is a sandbox designed for developers to test their integration with our payment processing services without using real money or impacting actual customer transactions. In this environment, developers can create test accounts, simulate transactions, and test their code in a safe, controlled setting.</td><td></td></tr><tr><td><mark style="color:blue;"><strong>Live environment</strong></mark></td><td>URL: <a href="https://api.dlocalgo.com/">https://api.dlocalgo.com</a></td><td><p>The Live environment is the production setting where real transactions are processed and actual money is involved. After developers have tested their integration in the Sandbox environment, they can switch to the Live environment to start processing real transactions.</p><p></p></td><td></td></tr></tbody></table>

{% hint style="warning" %}
Please note that in order to use the Live environment, developers must have a dLocal Go valid account and be authorized to use our payment processing services.
{% endhint %}

### <mark style="color:blue;">Step 1. Create a testing account</mark>

Get started with dLocal Go by [creating a free testing account](https://dashboard-sbx.dlocalgo.com/signup). Your testing account gives you access to the [testing environment](< https://api-sbx.dlocalgo.com>).

{% hint style="info" %}
If you want to create a **testing account**, please go to this link:  <https://dashboard-sbx.dlocalgo.com/signup>
{% endhint %}

<details>

<summary>How to access to your Testing keys</summary>

1. Go to <https://dashboard-sbx.dlocalgo.com/>.
2. Click on **Integrations**.&#x20;
3. Select **API Integration.**
4. A dialog box labeled "Install dLocal Go on your site" will appear.
5. In this box, you will find your private **Testing keys**:

   1. *Sandbox API Key*
   2. *Sandbox Secret Key*

   You can easily copy and paste these keys by clicking on the copy icon.

</details>

### <mark style="color:blue;">**Step 2. Try the testing environment**</mark>

To verify that your testing account is working correctly, let's create a payment as an example:

```
curl -X GET \
  https://api-sbx.dlocalgo.com/v1/me \
  -H 'authorization: Bearer <API_KEY>:<SECRET_KEY>' \
  -H 'content-type: application/json' \
  -d '{}'
```

#### Testing cards

Use these cards in the sandbox environment to validate successful and declined payment scenarios.

**Successful payment**

| Card number           | Expiration date | CVV     |
| --------------------- | --------------- | ------- |
| `4111 1111 1111 1111` | Any future date | Any CVV |
| `4242 4242 4242 4242` | Any future date | Any CVV |

**Declined payments**

Use the following Mastercard and Visa test cards to simulate different rejection reasons:

| Card number           | Simulated result            |
| --------------------- | --------------------------- |
| `5555 5555 5555 4444` | Rejected by bank            |
| `4000 0566 5566 5556` | Insufficient amount         |
| `2223 0031 2200 3222` | Call bank for authorize     |
| `5186 0017 0000 9726` | Card expired                |
| `4622 9431 2701 1022` | Card restricted by the bank |
| `5105 1051 0510 5100` | Invalid security code       |
| `5120 3501 0006 4537` | Rejected due to high risk   |

For all declined test cards:

* Expiration date: any future date
* CVV: any CVV

### <mark style="color:blue;">Step 3. Create a live account</mark>

You can now [create a live account](#how-to-access-to-your-live-integration-keys) on dLocal Go. Your live account grants you access to the [live environment](https://api.dlocalgo.com).

{% hint style="info" %}
To **create a live account at dLocal Go**, please visit the following link: [https://dashboard.dlocalgo.com/signup](https://dashboard.dlocalgo.com/signup?destination_url=%2Fhome)&#x20;
{% endhint %}

<details>

<summary>How to access to your Live Integration keys</summary>

1. Go to <https://dashboard.dlocalgo.com/>.
2. Click on **Integrations**.&#x20;
3. Select **API Integration.**
4. A dialog box labeled "Install dLocal Go on your site" will appear
5. In this box, you will find your private **Integration keys**:&#x20;

   1. *API Key*
   2. *Secret Key*

   You can easily copy and paste these keys by clicking on the copy icon.

</details>

### <mark style="color:blue;">Step 4. Get ready to accept live payments</mark>

To begin accepting live payments with your live account, you need to first configure your account.

{% hint style="danger" %}
Settings from your test account do not automatically transfer to your live account.
{% endhint %}

{% hint style="info" %}
You must configure your accepted payment methods on your live account dashboard; otherwise, the configurations will remain at their default settings.&#x20;
{% endhint %}

**Is this documentation clear enough?** If you don't find what you need, please provide feedback [here](https://share.hsforms.com/15ij4BwysSi26p8qPN-ZBOA5edia).&#x20;
