> For the complete documentation index, see [llms.txt](https://docs.dlocalgo.com/integration-api/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://docs.dlocalgo.com/integration-api/welcome-to-dlocal-go-api/transparent-checkout.md).

# Transparent checkout

dLocal Go SmartFields is our solution for embedding a secure checkout experience directly in your website.

With SmartFields, you can integrate payment fields into your existing checkout page, providing a seamless transaction experience for your customers while maintaining full control over the user interface and ensuring PCI DSS compliance.

## dLocal Go SmartFields Integration

This documentation explains how to integrate **dLocal Go SmartFields** into your application. SmartFields is the dLocalGo SDK that allows you to securely capture card data without sensitive information passing through your servers, ensuring PCI DSS compliance.

### What is SmartFields?

SmartFields is a JavaScript SDK that enables you to create secure input fields for credit/debit cards directly in your application. Card data never reaches your servers; instead, SmartFields generates a secure token that you can use to process the payment.

#### Key Benefits:

* **PCI Compliance**: Card data never touches your infrastructure
* **Security**: Automatic tokenization of sensitive data
* **User Experience**: Native input fields integrated into your UI
* **Customization**: You can customize the styling of the fields

### Prerequisites

> 📝 **Note**: To obtain the dLocal Go SmartFields API Key, you must request it from the dLocal Go support team. Please contact them via the chat available in your dLocal Go dashboard.

Before starting the integration, you need:

1. **dLocalGo Credentials**:
   * `DLOCALGO_API_KEY`: Your dLocalGo API key
   * `DLOCALGO_API_SECRET`: Your dLocalGo API secret
   * `SmartFields API Key`: A specific key for SmartFields (different from the standard API key)
2. **SDK URLs**:
   * **Sandbox**: `https://checkout-sbx.dlocalgo.com/js/dlocalgo-smartfields-bundled.js`
   * **Production**: `https://checkout.dlocalgo.com/js/dlocalgo-smartfields-bundled.js`

### Example Project

We provide a complete example project that demonstrates a full SmartFields integration. You can use it as a reference to understand how the integration works:

**Example Project**: <https://bitbucket.org/directopago/dgo-smartfields-sample/src/main/>

The example project includes:

* Frontend implementation with SmartFields integration
* Backend API endpoints for payment creation and confirmation
* Complete checkout flow with error handling
* 3DS authentication handling

### Integration Flow

The integration process follows these steps:

1. **Create a payment** in dLocalGo to obtain a `merchant_checkout_token`
2. **Load the SmartFields SDK** on your page
3. **Initialize SmartFields** with your API key and the checkout token
4. **Mount the card field** in an HTML container
5. **Capture the card token** when the user submits the form
6. **Confirm the payment** using the checkout token and the card token

### Step-by-Step Implementation

#### 1. Load the SmartFields SDK

Include the SmartFields script in your HTML before your JavaScript code:

```html
<!-- For Sandbox -->
<script src="https://checkout-sbx.dlocalgo.com/js/dlocalgo-smartfields-bundled.js"></script>

<!-- For Production -->
<!-- <script src="https://checkout.dlocalgo.com/js/dlocalgo-smartfields-bundled.js"></script> -->
```

#### 2. Create a Payment and Get the Checkout Token

Before initializing SmartFields, you need to create a payment in dLocalGo to obtain a `merchant_checkout_token`. This token is required to initialize SmartFields.

To achieve this, create a new endpoint in your backend, and fetch it from your frontend.

**Your Backend Endpoint: `POST /api/create-payment`**

**Frontend implementation:**

```javascript
// In your frontend
async function createPaymentAndGetToken() {
    try {
        const response = await fetch('/api/create-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: 25410,
                currency: 'ARS',
                country: 'AR'
            })
        });

        const data = await response.json();
        const checkoutToken = data?.merchant_checkout_token;

        if (checkoutToken) {
            // Store the token for later use
            checkoutToken = checkoutToken;
            // Initialize SmartFields with this token
            await initDLocalGo();
        }
    } catch (error) {
        console.error('Error creating payment:', error);
    }
}
```

**Backend Implementation:**

**In this endpoint you will fetch the** [**payments endpoint of dLocal Go**](/integration-api/welcome-to-dlocal-go-api/payments/create-a-payment.md)**.**

**IMPORTANT: remember to include the `allow_transparent: true` parameter while creating the payment.**

```javascript
app.post('/api/create-payment', async (req, res) => {
    const { amount, currency, country } = req.body;

    const apiKey = process.env.DLOCALGO_API_KEY;
    const apiSecret = process.env.DLOCALGO_API_SECRET;
    const apiUrl = process.env.DLOCALGO_API_URL || 'https://api-sbx.dlocalgo.com';

    const authorizationHeader = `Bearer ${apiKey}:${apiSecret}`;

    const requestBody = {
        amount,
        currency,
        notification_url: 'https://webhook.site/your-webhook-url',
        description: 'Sample checkout payment',
        success_url: 'https://example.com',
        allow_transparent: true,
        country,
    };

    try {
        const response = await axios.post(
            `${apiUrl}/v1/payments`, // DGO Payment Endpoint
            requestBody,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authorizationHeader,
                },
            }
        );

        return res.json(response.data); // Includes merchant_checkout_token
    } catch (error) {
        return res.status(500).json({ error: 'Payment creation failed' });
    }
});
```

#### 3. Initialize SmartFields

Once you have the `merchant_checkout_token`, initialize SmartFields:

```javascript
let smartFieldsApiKey = 'YOUR_SMARTFIELDS_API_KEY'; // ⚠️ Replace with your actual key
let checkoutToken = null;
let cardField = null;

async function initDLocalGo() {
    // Initialize the SDK with your SmartFields API Key and the checkout token
    await window.dlocalGo.initialize(
        smartFieldsApiKey,
        checkoutToken
    );

    console.log('dLocalGo SDK initialized');

    // Get the container where we'll mount the card field
    const cardNumberBox = document.getElementById("cardNumber");

    // Customize the field style (optional)
    const style = {
        base: {
            fontSize: "18px",
            lineHeight: "28px",
            fontFamily: "'Inter UI medium', sans-serif",
            fontSmoothing: "antialiased",
            fontWeight: "500",
            color: "#32325d",
            "::placeholder": {
                color: "#aab7c4",
            },
            iconColor: "#adbfd3",
        },
    };

    // Create and mount the card field
    const fields = window.dlocalGo.fields();
    cardField = fields.create("card", { style });
    cardField.mount(cardNumberBox);
}
```

**⚠️ IMPORTANT**: You must replace `smartFieldsApiKey` with your actual SmartFields key. This key is different from your standard `DLOCALGO_API_KEY`.

To customize the field container, you can add CSS styles using the `.DlocalField` class. For example:

```css
.DlocalField {
  background-color: white;
  height: 50px;
  padding: 10px 12px;
  border-radius: 0.5rem;
  border: 1px solid rgb(209 213 219 / var(--tw-border-opacity, 1));
  box-shadow: 0 1px 3px 0 #e6ebf1;
  -webkit-transition: box-shadow 150ms ease;
  transition: box-shadow 150ms ease;
}
```

#### 4. Prepare the HTML Container

Create a div container in your HTML where the card field will be mounted:

```html
<div>
    <label for="card-number" class="block text-sm font-medium text-gray-700 mb-1">
        Card Number
    </label>
    <div id="cardNumber" class="w-full px-4 py-2 border border-gray-300 rounded-lg"></div>
</div>
```

The SDK will handle creating and rendering the input field inside this container.

#### 5. Create the Card Token on Form Submission

When the user submits the form, you need to create a card token using SmartFields:

```javascript
document.getElementById('checkout-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    // Collect form data
    const formData = {
        clientFirstName: document.getElementById('client-first-name').value,
        clientLastName: document.getElementById('client-last-name').value,
        clientDocumentType: document.getElementById('client-document-type').value,
        clientDocument: document.getElementById('client-document').value,
        clientEmail: document.getElementById('email').value,
    };

    try {
        // Create the card token using SmartFields
        const cardholderName = `${formData.clientFirstName} ${formData.clientLastName}`.trim();
        const response = await window.dlocalGo.createCardToken(cardField, {
            name: cardholderName
        });

        const { token: cardToken } = response;
        console.log(`Card token: ${cardToken}`);

        // Now you can send the cardToken to the backend along with the checkoutToken
        await confirmPayment(checkoutToken, cardToken, formData);

    } catch (error) {
        console.error('Error creating card token:', error);
        alert('Error processing card. Please check the card details.');
    }
});
```

#### 6. Confirm the Payment

Send the `cardToken` and `checkoutToken` to your backend to confirm the payment:

**Frontend Implementation** (fetching your `confirm-payment` backend endpoint) :

```javascript
async function confirmPayment(checkoutToken, cardToken, formData) {
    try {
        const response = await fetch('/api/confirm-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                checkoutToken: checkoutToken,
                cardToken: cardToken,
                clientFirstName: formData.clientFirstName,
                clientLastName: formData.clientLastName,
                clientDocumentType: formData.clientDocumentType,
                clientDocument: formData.clientDocument,
                clientEmail: formData.clientEmail,
            })
        });

        const data = await response.json();

        if (response.ok) {
            // If there's a redirect URL, it's for 3DS authentication
            if (data.redirect_url) {
                window.location.href = data.redirect_url;
            } else {
                // Payment successful
                console.log('Payment successful:', data);
            }
        } else {
            // Payment error
            console.error('Payment failed:', data);
        }
    } catch (error) {
        console.error('Error confirming payment:', error);
    }
}
```

**Your `confirm-payment` Backend Implementation:**

```javascript
app.post('/api/confirm-payment', async (req, res) => {
    const {
        checkoutToken,
        cardToken,
        clientFirstName,
        clientLastName,
        clientDocumentType,
        clientDocument,
        clientEmail
    } = req.body;

    const apiKey = process.env.DLOCALGO_API_KEY;
    const apiSecret = process.env.DLOCALGO_API_SECRET;
    const apiUrl = process.env.DLOCALGO_API_URL || 'https://api-sbx.dlocalgo.com';

    const authorizationHeader = `Bearer ${apiKey}:${apiSecret}`;

    const requestBody = {
        cardToken: cardToken,
        clientFirstName: clientFirstName,
        clientLastName: clientLastName,
        clientDocumentType: clientDocumentType,
        clientDocument: clientDocument,
        clientEmail: clientEmail
    };

    try {
        const response = await axios.post(
            `${apiUrl}/v1/payments/confirm/${checkoutToken}`, // DGO Confirm Payment Endpoint
            requestBody,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authorizationHeader,
                },
            }
        );

        return res.json(response.data);
    } catch (error) {
        return res.status(500).json({ error: 'Payment confirmation failed' });
    }
});
```

### Style Customization

You can customize the appearance of the card field by passing a `style` object when creating the field:

```javascript
const style = {
    base: {
        fontSize: "18px",
        lineHeight: "28px",
        fontFamily: "'Inter UI medium', sans-serif",
        color: "#32325d",
        "::placeholder": {
            color: "#aab7c4",
        },
        iconColor: "#adbfd3",
    },
    invalid: {
        color: "#ef4444",
        iconColor: "#ef4444",
    },
    focus: {
        color: "#3b82f6",
    },
};

const fields = window.dlocalGo.fields();
const cardField = fields.create("card", { style });
```

### 3DS Authentication Handling

If the payment requires 3D Secure authentication, dLocalGo will return a `redirect_url` in the confirmation response. You must redirect the user to this URL:

```javascript
if (confirmData.redirect_url) {
    console.log('Redirecting to 3DS authentication');
    window.location.href = confirmData.redirect_url;
}
```

After completing the 3DS authentication, the user will be redirected to the `success_url` you configured when creating the payment.

### Installments

If you want to support **installments** in your checkout, a few additional steps are required.

The library exposes the `onInstallmentsChange` method, which allows you to register a listener. This listener is triggered whenever installment options are available for the card used in the payment. You can use this callback to populate your UI component with the available installment options.

The listener receives an array of objects with the following structure:

```typescript
[
  {
    id: string,               // Installment option ID
    currency: string,         // Payment currency
    installments: number,     // Number of installments
    installment_amount: number, // Amount per installment
    total_amount: number      // Total amount (sum of all installments)
  }
]
```

#### Example:

```js
dlocalGo.onInstallmentsChange((installments) => {
    installmentsSelect.innerHTML =
      '<option value="">Select installments</option>';

    if (installments && installments.length > 1) {
      installmentsContainer.style.display = "block";

      installments.forEach((installment) => {
        const option = document.createElement("option");
        option.value = installment.id;
        option.textContent = `${installment.installments} Installments of ${installment.currency} ${installment.installment_amount} = ${installment.currency} ${installment.total_amount}`;
        installmentsSelect.appendChild(option);
      });
    } else {
      installmentsContainer.style.display = "none";
    }
  });
```

Then, send the **installments ID** of the plan selected by the payer to your backend and include it in the **confirm payment** payload:

```javascript
app.post('/api/confirm-payment', async (req, res) => {
    const {
        checkoutToken,
        cardToken,
        clientFirstName,
        clientLastName,
        clientDocumentType,
        clientDocument,
        clientEmail,
        installmentsId, // installment id of the selected plan
    } = req.body;

    const apiKey = process.env.DLOCALGO_API_KEY;
    const apiSecret = process.env.DLOCALGO_API_SECRET;
    const apiUrl = process.env.DLOCALGO_API_URL || 'https://api-sbx.dlocalgo.com';

    const authorizationHeader = `Bearer ${apiKey}:${apiSecret}`;

    const requestBody = {
        cardToken: cardToken,
        clientFirstName: clientFirstName,
        clientLastName: clientLastName,
        clientDocumentType: clientDocumentType,
        clientDocument: clientDocument,
        clientEmail: clientEmail,
        installmentsId: installmentsId
    };

    try {
        const response = await axios.post(
            `${apiUrl}/v1/payments/confirm/${checkoutToken}`, // DGO Confirm Payment Endpoint
            requestBody,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authorizationHeader,
                },
            }
        );

        return res.json(response.data);
    } catch (error) {
        return res.status(500).json({ error: 'Payment confirmation failed' });
    }
});
```

### Card Bin Information Event Handler

#### `onCardBinChange(callback)`

Registers an event handler that listens for changes in the card BIN (Bank Identification Number).

The provided `callback` function will be invoked whenever a card BIN change event is dispatched.\
This event is triggered as soon as the first 6 digits of the card number (the BIN) are identified or updated during user input.

#### Parameters

* **`callback`** `(function)` – A function that will be executed when the BIN change event occurs.\
  The callback receives a single argument: an object containing metadata associated with the detected BIN.

#### Callback Payload Structure

When triggered, the callback is invoked with an object containing the following properties:

```json
{
  "bin": "424242",
  "brand": "VI",
  "category": "CLASSIC",
  "country": "GB",
  "issuer": "STRIPE PAYMENTS UK LIMITED",
  "type": "CREDIT"
}
```

**Example**

```javascript
onCardBinChange((binData) => {
  console.log("BIN detected:", binData.bin);
  console.log("Card brand:", binData.brand);
});
```

You can use this event to apply dynamic promotions or discounts to specific card BINs.

### Environment Variables

Make sure to configure the following environment variables in your `.env` file:

```env
DLOCALGO_API_KEY=your_api_key
DLOCALGO_API_SECRET=your_api_secret
DLOCALGO_API_URL=https://api-sbx.dlocalgo.com  # Sandbox
# DLOCALGO_API_URL=https://api.dlocalgo.com    # Production
PORT=3000
```

### Important Considerations

#### Security

1. **Never expose your `DLOCALGO_API_SECRET`** in the frontend. It should only be used in the backend.
2. **The `SmartFields API Key`** can be in the frontend, but it's recommended to keep it configurable.
3. **Card data must never pass through your servers**. SmartFields handles everything on the client side.

#### Execution Order

It's important to follow this order:

1. Load the SmartFields SDK
2. Create the payment and obtain the `merchant_checkout_token`
3. Initialize SmartFields with the token
4. Mount the card field
5. Wait for the user to complete the form
6. Create the `cardToken` on submit
7. Confirm the payment with both tokens

#### Error Handling

Always handle errors at each step:

```javascript
try {
    // Create card token
    const response = await window.dlocalGo.createCardToken(cardField, { name });
} catch (error) {
    console.error('Error creating card token:', error);
    // Show user-friendly message
    alert('Error processing card. Please check the card details.');
}
```

### Complete Flow Summary

```
1. User loads the checkout page
   ↓
2. Frontend calls /api/create-payment
   ↓
3. Backend creates payment in dLocalGo and returns merchant_checkout_token
   ↓
4. Frontend initializes SmartFields with the token
   ↓
5. SmartFields mounts the card field in the DOM
   ↓
6. User completes the form and submits
   ↓
7. Frontend creates cardToken using SmartFields
   ↓
8. Frontend sends cardToken + checkoutToken to backend
   ↓
9. Backend confirms the payment in dLocalGo
   ↓
10. If 3DS is required, redirects to authentication URL
    If not, shows success confirmation
```

### API Reference

#### dlocalGo.initialize(api\_key: string, checkout\_token: string): void

This method initializes the transparent checkout, necessary to show the credit card input.

| Option           | Type   | Description                                                         |
| ---------------- | ------ | ------------------------------------------------------------------- |
| `api_key`        | string | Merchant Smart Field API key (36 chars)                             |
| `checkout_token` | string | Merchant Checkout Token (Obtained from the create payment endpoint) |

#### dlocalGo.fields()

Create pre-built UI components to collect payment information.

#### dlocalGo.fields().create(type: string, options: object): DLocalField

Creates a field instance that can be mounted to a DOM element.

| Option    | Type   | Description                                           |
| --------- | ------ | ----------------------------------------------------- |
| `type`    | string | Type of dLocal Field                                  |
| `options` | object | Field configuration options (see Field Options below) |

**dLocal Field Types**

| **dLocal Field Type** | **Description**                                                                |
| --------------------- | ------------------------------------------------------------------------------ |
| `card`                | A flexible single-line input that collects cardNumber, cardExpiry and cardCvc. |
| `pan`                 | The card's number. Use alongside the `expiration` and `cvv` Smart Fields.      |
| `expiration`          | The card's expiration date. Use alongside the `pan` and `cvv` Smart Fields.    |
| `cvv`                 | The card's CVC number. Use alongside the `pan` and `expiration` Smart Fields.  |

#### Field Options

**Common options**

| **Option**    | **Type**          | **Description**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `placeholder` | String or Object  | Set custom placeholder for Field. For `number`, `expiration` or `cvv` Fields this option is a string with the corresponding placeholder value. If the Field is a `card`, this option is an `object` with the corresponding placeholder value for each input: `{cvv: "cvv placeholder", number: "number placeholder", expiration: "expiration placeholder"}`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `classes`     | Object (Optional) | <p>Set custom class names on the container DOM element when the dLocal Field is in a particular state.<br>- <code>base</code> - The base class applied to the container. Defaults to <strong>DlocalField</strong>.<br>- <code>complete</code> - The class name to apply when the Field is complete. Defaults to <strong>DlocalField--complete</strong>.<br>- <code>empty</code> - The class name to apply when the Field is empty. Defaults to <strong>DlocalField--empty</strong>.<br>- <code>focus</code> - The class name to apply when the Field is focused. Defaults to <strong>DlocalField--focus</strong>.<br>- <code>invalid</code> - The class name to apply when the Field is invalid. Defaults to <strong>DlocalField--invalid</strong>.<br>- <code>webkitAutofill</code> - The class name to apply when the Field has its value autofilled by the browser (only on Chrome and Safari). Defaults to <strong>DlocalField--autofilled</strong>.</p>                                                                                                                                                                                                                                                                                                                                                                                    |
| `style`       | Object (Optional) | <p>Customize appearance using CSS properties. Style is specified as an object for any of the variants below:<br>- <code>base</code>, base style—all other variants inherit from this style.<br>- <code>complete</code>, applied when the Field has valid input.<br>- <code>empty</code>, applied when the Field has no customer input.<br>- <code>invalid</code>, applied when the Field has invalid input.<br>- <code>autofilled</code>, applied when the Field is autofilled.<br><br>For each of the above, the properties below can be customized:<br>- <code>color</code><br>- <code>fontFamily</code><br>- <code>fontSize</code><br>- <code>fontSmoothing</code><br>- <code>fontStyle</code><br>- <code>fontVariant</code><br>- <code>iconColor</code><br>- <code>lineHeight</code>, to avoid cursors being rendered inconsistently across browsers, consider using a padding on the Field's container instead.<br>- <code>letterSpacing</code><br>- <code>textDecoration</code><br>- <code>textShadow</code><br>- <code>textTransform</code><br><br>The following pseudo-classes and pseudo-elements can also be styled with the above properties, as a nested object inside the variant:<br>- <code>:hover</code><br>- <code>:focus</code><br>- <code>::placeholder</code><br>- <code>::selection</code><br>- <code>:disabled</code></p> |

#### dlocalGo.createCardToken(field: DLocalField, options: object): Promise

Creates a secure token from the card data entered in the field.

| Option    | Type        | Description                                           |
| --------- | ----------- | ----------------------------------------------------- |
| `field`   | DLocalField | The field instance created with `fields().create()`   |
| `options` | object      | Options object with `name` property (cardholder name) |

**Returns:** Promise that resolves to an object with a `token` property containing the card token.

### References

* **SDK Sandbox**: `https://checkout-sbx.dlocalgo.com/js/dlocalgo-smartfields-bundled.js`
* **SDK Production**: `https://checkout.dlocalgo.com/js/dlocalgo-smartfields-bundled.js`
* **API Sandbox**: `https://api-sbx.dlocalgo.com`
* **API Production**: `https://api.dlocalgo.com`
* **Example Project**: [https://bitbucket.org/directopago/dgo-smartfields-sample/](https://bitbucket.org/directopago/dgo-smartfields-sample/src/main/)
