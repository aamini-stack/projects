# @aamini/infra

Infrastructure as Code for the @aamini monorepo using Pulumi.

## Azure Blob Storage for Ducky MOT Images

### Overview
This infrastructure creates an Azure Storage Account with blob container for hosting images from the `ducky-mot` application.

### Resources Created
- **Storage Account**: `duckymotimages` (Standard_LRS)
- **Blob Container**: `images` (public blob access)
- **Static Website Hosting**: Enabled
- **CORS Configuration**: Configured for web access

### Deployment

```bash
# Install dependencies
pnpm install

# Configure Azure (if not already done)
pulumi config set azure-native:subscriptionId <your-subscription-id>
pulumi config set azure-native:resourceGroupName <your-resource-group>

# Deploy
pulumi up
```

### Outputs

After deployment, you'll get these outputs:
- `storageAccountName`: The name of the storage account
- `storageAccountPrimaryEndpoint`: The primary blob endpoint URL
- `imageContainerUrl`: Direct URL to the images container
- `staticWebsiteUrl`: URL for static website hosting

### Usage in Ducky MOT

To use the blob storage in your application:

```typescript
// Example: Upload an image
const imageUrl = `https://duckymotimages.blob.core.windows.net/images/${filename}`
```

### Uploading Images

You can upload images via:

1. **Azure Portal**: Navigate to Storage Account → Containers → images
2. **Azure CLI**:
   ```bash
   az storage blob upload \
     --account-name duckymotimages \
     --container-name images \
     --name myimage.jpg \
     --file ./myimage.jpg
   ```
3. **Azure Storage SDK**: Use the `@azure/storage-blob` package in your app

### CORS Configuration

The blob storage is configured with CORS to allow:
- **Origins**: `*` (update to specific domains in production)
- **Methods**: GET, HEAD, OPTIONS
- **Max Age**: 3600 seconds

### Security Notes

- Public blob access is enabled for image hosting
- HTTPS is enforced (TLS 1.2 minimum)
- Update CORS `allowedOrigins` to specific domains for production

---

## Flux GitOps Bootstrap

flux bootstrap github \
 --owner=aamini-stack \
 --repository=projects \
 --branch=infra \
 --path=./packages/infra/manifests/gitops \
 --personal --force

pulumi config get github:token
