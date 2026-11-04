> For the complete documentation index, see [llms.txt](https://docs.dlocalgo.com/integration-api/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://docs.dlocalgo.com/integration-api/welcome-to-dlocal-go-api/recurring-links/create-a-recurring-link.md).

# Create a recurring link

Create a reusable payment link.

<mark style="color:green;">`POST`</mark> `https://api.dlocalgo.com/v1/recurring-payments`

#### Headers

| Name                                            | Type   | Description                  |
| ----------------------------------------------- | ------ | ---------------------------- |
| Authorization<mark style="color:red;">\*</mark> | string | Bearer \[api*key:secret*key] |

#### Request Body

<table><thead><tr><th width="182">Name</th><th width="120">Type</th><th>Description</th></tr></thead><tbody><tr><td>country</td><td>string</td><td>User's country code (ISO 3166-1 alpha-2). If not provided, the checkout will prompt the payer to enter their country.</td></tr><tr><td>currency<mark style="color:red;">*</mark></td><td>string</td><td><p>Three-letter ISO-4217 currency code, in uppercase.</p><p>Examples: USD, BRL.</p></td></tr><tr><td>amount<mark style="color:red;">*</mark></td><td>number</td><td>Transaction amount (in the specified currency).</td></tr><tr><td>description</td><td>string</td><td>Description of the payment.</td></tr><tr><td>notification_url</td><td>string</td><td>Notification URL used to inform about every status change of any of the recurring payments. If not specified, the platform will not send status change notifications.</td></tr><tr><td>success_url</td><td>string</td><td>URL to which the user is redirected after a successful payment.</td></tr></tbody></table>

{% tabs %}
{% tab title="Sample request" %}

```sh
curl --location 'https://api-sbx.dlocalgo.com/v1/recurring-payments/' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer xxxxxxxx:yyyyyyyy' \
--data '{
    "country": "UY",
    "currency": "UYU",
    "amount": 600,
    "description": "Test recurring with notifications",
    "notification_url": "https://webhook.site/23f6c9cd-0f93-4379-86a8-895939173338"
}'
```

{% endtab %}

{% tab title="200: OK Example response" %}

<pre class="language-javascript"><code class="lang-javascript"><strong>{
</strong>    "url": "https://checkout.dlocalgo.com/validate/recurring/uYAJVXw4pJTc6QyFvkWXvm28pl5NcLW4"
}
</code></pre>

{% endtab %}
{% endtabs %}
