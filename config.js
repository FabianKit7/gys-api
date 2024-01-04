
// email templates not used anywhere though
export const INCORRECT_PASSWORD_TEMPLATE = (full_name, username) => {
    return `
<div>
<p class="MsoNormal"><span lang="EN">Dear <b>${full_name}</b>,</span></p>

<p class="MsoNormal"><span lang="EN"><o:p>&nbsp;</o:p></span></p>

<p class="MsoNormal"><span lang="EN">We regret to inform you that the password
provided for @<b>${username}</b>, to access our service is incorrect. We kindly request
you to attempt re-logging into your dashboard by following this <a href="http://app.grow-your-social.com"><span style="color:#1155CC">link</span></a>.
Once the correct password is provided, our team will proceed to log in to your
account within the next 24 hours.</span></p>

<p class="MsoNormal"><span lang="EN"><o:p>&nbsp;</o:p></span></p>

<p class="MsoNormal"><span lang="EN">Should you require further assistance, please
do not hesitate to contact us at support@grow-your-social.com.</span></p>

<p class="MsoNormal"><span lang="EN"><o:p>&nbsp;</o:p></span></p>

<p class="MsoNormal"><span lang="EN">Best regards,</span></p>

<p class="MsoNormal"><span class="SpellE"><span lang="EN">Grow-your-social</span></span><span lang="EN"> Team</span></p>
</div>
`
}

export const TWO_FACTOR_TEMPLATE = (full_name, username) => {
    return `
<div>
<p class="MsoNormal"><span lang="EN">Hey <b>${full_name}</b>,</span></p>

<p class="MsoNormal"><span lang="EN"><o:p>&nbsp;</o:p></span></p>

<p class="MsoNormal"><span lang="EN">We regret to inform you that your account @<b>${username}</b>
has two-factor authentication enabled, which is currently preventing us from
accessing the necessary information to initiate our service. We understand the
importance of account security, and we want to assure you that your account's
safety is our utmost priority.</span></p>

<p class="MsoNormal"><span lang="EN"><o:p>&nbsp;</o:p></span></p>

<p class="MsoNormal"><span lang="EN">In order for our team to proceed with logging
into your account and commencing the service, we kindly request you to
temporarily disable the two-factor authentication feature. To do so, please
follow these steps:</span></p>

<p class="MsoNormal"><span lang="EN"><o:p>&nbsp;</o:p></span></p>

<p class="MsoNormal"><span lang="EN">Access your Instagram account.</span></p>

<p class="MsoNormal"><span lang="EN">Navigate to the "Settings" section.</span></p>

<p class="MsoNormal"><span lang="EN">Locate and select the "Security"
option.</span></p>

<p class="MsoNormal"><span lang="EN">Find the "Two-Factor Authentication"
settings.</span></p>

<p class="MsoNormal"><span lang="EN">Disable the two-factor authentication feature.</span></p>

<p class="MsoNormal"><span lang="EN">Once the two-factor authentication is
disabled, our team will be able to log into your account within the next 24
hours to initiate the requested service. We assure you that all necessary
precautions will be taken to safeguard your account and ensure its security
throughout the process.</span></p>

<p class="MsoNormal"><span lang="EN"><o:p>&nbsp;</o:p></span></p>

<p class="MsoNormal"><span lang="EN">After completing the steps above we kindly
request you to attempt re-logging into your dashboard by following this <a href="http://app.grow-your-social.com"><span style="color:#1155CC">link</span></a></span></p>

<p class="MsoNormal"><span lang="EN"><o:p>&nbsp;</o:p></span></p>

<p class="MsoNormal"><span lang="EN"><o:p>&nbsp;</o:p></span></p>

<p class="MsoNormal"><span lang="EN">If you have any concerns or require further
assistance, please do not hesitate to reach out to us at
support@grow-your-social.com. Our dedicated support team is ready to assist you.</span></p>

<p class="MsoNormal"><span lang="EN"><o:p>&nbsp;</o:p></span></p>

<p class="MsoNormal"><span lang="EN">Thank you for your cooperation.</span></p>

<p class="MsoNormal"><span lang="EN"><o:p>&nbsp;</o:p></span></p>

<p class="MsoNormal"><span lang="EN">Kind regards,</span></p>

<p class="MsoNormal"><span class="SpellE"><span lang="EN">Grow-your-social</span></span><span lang="EN"> Team</span></p>
</div>

`
}

export const NOT_CONNECTED_TEMPLATE = (full_name) => {
    return `
<div>
<p class="MsoNormal"><span lang="EN">Dear <b>${full_name}</b>,</span></p>

<p class="MsoNormal"><span lang="EN"><o:p>&nbsp;</o:p></span></p>

<p class="MsoNormal"><span lang="EN">We would like to bring to your attention that
you are currently not connected to our service. We kindly request you to
establish the connection at your earliest convenience by clicking on the
provided <a href="http://app.grow-your-social.com"><span style="color:#1155CC">link</span></a>.
By doing so, we can promptly initiate the growth process for your account.</span></p>

<p class="MsoNormal"><span lang="EN"><o:p>&nbsp;</o:p></span></p>

<p class="MsoNormal"><span lang="EN">Once you enter your login credentials, our
team will proceed to connect to your account within the next 24 hours to begin
the desired growth.</span></p>

<p class="MsoNormal"><span lang="EN"><o:p>&nbsp;</o:p></span></p>

<p class="MsoNormal"><span lang="EN">Please be aware that you may receive a login
attempt notification from us on Instagram. To ensure a seamless connection, we
kindly ask you to acknowledge the attempt by clicking on the "That Was
Me" option. This will grant us the necessary access to your account in
order to commence the growth process.</span></p>

<p class="MsoNormal"><span lang="EN"><o:p>&nbsp;</o:p></span></p>

<p class="MsoNormal"><span lang="EN">Furthermore, we would like to emphasize the
importance of selecting appropriate targets. We recommend entering 10-20
targets initially and periodically adjusting them on a monthly basis to achieve
optimal growth results.</span></p>

<p class="MsoNormal"><span lang="EN"><o:p>&nbsp;</o:p></span></p>

<p class="MsoNormal"><span lang="EN">If you have any inquiries or require further
assistance, please do not hesitate to contact us. We are committed to providing
you with the support you need.</span></p>

<p class="MsoNormal"><span lang="EN"><o:p>&nbsp;</o:p></span></p>

<p class="MsoNormal"><span lang="EN">Thank you for your cooperation.</span></p>

<p class="MsoNormal"><span lang="EN"><o:p>&nbsp;</o:p></span></p>

<p class="MsoNormal"><span lang="EN">Kind regards,</span></p>

<p class="MsoNormal"><span class="SpellE"><span lang="EN">Grow-your-social</span></span><span lang="EN"> Team.</span></p>
</div>
`
}