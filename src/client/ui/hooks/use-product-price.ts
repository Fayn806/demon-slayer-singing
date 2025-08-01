import { useAsync } from "@rbxts/pretty-react-hooks";
import { MarketplaceService } from "@rbxts/services";

export function useProductPrice(productId: number): number | string {
	const [info = "N/A"] = useAsync(async () => {
		return Promise.retryWithDelay(
			async () => {
				return MarketplaceService.GetProductInfo(productId, Enum.InfoType.Product)
					.PriceInRobux;
			},
			10,
			5,
		);
	});

	return info;
}
