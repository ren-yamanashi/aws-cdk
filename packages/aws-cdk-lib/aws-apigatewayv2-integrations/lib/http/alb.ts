import { HttpPrivateIntegrationOptions } from './base-types';
import { HttpPrivateIntegration } from './private/integration';
import { HttpRouteIntegrationBindOptions, HttpRouteIntegrationConfig } from '../../../aws-apigatewayv2';
import * as ec2 from '../../../aws-ec2';
import * as elbv2 from '../../../aws-elasticloadbalancingv2';
import { ValidationError } from '../../../core/lib/errors';

/**
 * Properties to initialize `HttpAlbIntegration`.
 */
export interface HttpAlbIntegrationProps extends HttpPrivateIntegrationOptions {
}

/**
 * The Application Load Balancer integration resource for HTTP API
 */
export class HttpAlbIntegration extends HttpPrivateIntegration {
  /**
   * @param id id of the underlying integration construct
   * @param listener the ELB application listener
   * @param props properties to configure the integration
   */
  constructor(
    id: string,
    private readonly listener: elbv2.IApplicationListener,
    private readonly props: HttpAlbIntegrationProps = {}) {
    super(id);
  }

  public bind(options: HttpRouteIntegrationBindOptions): HttpRouteIntegrationConfig {
    let vpc: ec2.IVpc | undefined = this.props.vpcLink?.vpc;
    if (!vpc && (this.listener instanceof elbv2.ApplicationListener)) {
      vpc = this.listener.loadBalancer.vpc;
    }
    if (!vpc) {
      throw new ValidationError('The vpcLink property must be specified when using an imported Application Listener.', options.scope);
    }

    const vpcLink = this._configureVpcLink(options, {
      vpcLink: this.props.vpcLink,
      vpc,
    });

    return {
      method: this.props.method ?? this.httpMethod,
      payloadFormatVersion: this.payloadFormatVersion,
      type: this.integrationType,
      connectionType: this.connectionType,
      connectionId: vpcLink.vpcLinkId,
      uri: this.listener.listenerArn,
      secureServerName: this.props.secureServerName,
      parameterMapping: this.props.parameterMapping,
      timeout: this.props.timeout,
    };
  }
}
